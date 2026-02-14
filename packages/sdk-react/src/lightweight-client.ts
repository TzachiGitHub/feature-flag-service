import { IFeatureFlagClient } from './context';

interface FFContext {
  kind: string;
  key: string;
  name?: string;
  attributes?: Record<string, any>;
}

interface FFOptions {
  baseUrl?: string;
  streaming?: boolean;
  pollingInterval?: number;
  flushInterval?: number;
  bootstrap?: Record<string, any>;
  offline?: boolean;
  storageKey?: string;
}

type Listener = (...args: any[]) => void;

/**
 * Lightweight built-in client that fetches server-evaluated flags via HTTP/SSE.
 * Makes sdk-react self-contained without requiring sdk-js.
 */
export class LightweightClient implements IFeatureFlagClient {
  private sdkKey: string;
  private context: FFContext;
  private options: FFOptions;
  private flags: Record<string, any> = {};
  private details: Record<string, { value: any; variationId: string; reason: string; ruleIndex?: number }> = {};
  private ready = false;
  private listeners: Record<string, Set<Listener>> = {};
  private eventSource: EventSource | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private eventQueue: Array<{ kind: string; key: string; data?: any; metricValue?: number; timestamp: number }> = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(sdkKey: string, context: FFContext, options: FFOptions = {}) {
    this.sdkKey = sdkKey;
    this.context = context;
    this.options = { baseUrl: '', streaming: true, pollingInterval: 30000, flushInterval: 10000, ...options };

    if (options.bootstrap) {
      this.flags = { ...options.bootstrap };
      this.ready = true;
    }
  }

  async initialize(): Promise<void> {
    if (this.options.offline) {
      this.ready = true;
      this.emit('ready');
      return;
    }

    try {
      await this.fetchFlags();
      this.ready = true;
      this.emit('ready');
    } catch {
      // Still mark ready with bootstrap/empty flags
      this.ready = true;
      this.emit('ready');
    }

    if (this.options.streaming && typeof EventSource !== 'undefined') {
      this.startSSE();
    } else {
      this.startPolling();
    }

    this.flushTimer = setInterval(() => this.flush(), this.options.flushInterval!);
  }

  private async fetchFlags(): Promise<void> {
    const base = this.options.baseUrl || '';
    const url = `${base}/api/sdk/flags`;
    const contextParam = btoa(JSON.stringify(this.context));
    const res = await fetch(`${url}?context=${encodeURIComponent(contextParam)}`, {
      method: 'GET',
      headers: {
        'Authorization': this.sdkKey,
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const oldFlags = this.flags;
    this.flags = data.flags || data;
    this.details = data.details || {};

    // Emit change events
    for (const key of Object.keys(this.flags)) {
      if (oldFlags[key] !== this.flags[key]) {
        this.emit('change', key, this.flags[key], oldFlags[key]);
      }
    }
  }

  private startSSE(): void {
    const base = this.options.baseUrl || '';
    const url = `${base}/api/sdk/stream?authorization=${encodeURIComponent(this.sdkKey)}`;
    try {
      this.eventSource = new EventSource(url);
      this.eventSource.addEventListener('put', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const oldFlags = this.flags;
          this.flags = data.flags || data;
          if (data.details) this.details = data.details;
          for (const key of Object.keys(this.flags)) {
            if (oldFlags[key] !== this.flags[key]) {
              this.emit('change', key, this.flags[key], oldFlags[key]);
            }
          }
        } catch { /* ignore parse errors */ }
      });
      this.eventSource.addEventListener('patch', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.key) {
            const oldValue = this.flags[data.key];
            this.flags[data.key] = data.value;
            if (data.variationId) {
              this.details[data.key] = { value: data.value, variationId: data.variationId, reason: data.reason || 'FALLTHROUGH' };
            }
            if (oldValue !== data.value) {
              this.emit('change', data.key, data.value, oldValue);
            }
          }
        } catch { /* ignore parse errors */ }
      });
      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.eventSource = null;
        this.startPolling();
      };
    } catch {
      this.startPolling();
    }
  }

  private startPolling(): void {
    if (this.pollingTimer) return;
    this.pollingTimer = setInterval(() => this.fetchFlags().catch(() => {}), this.options.pollingInterval!);
  }

  private emit(event: string, ...args: any[]): void {
    const set = this.listeners[event];
    if (set) set.forEach(fn => fn(...args));
  }

  variation(flagKey: string, defaultValue: any): any {
    return flagKey in this.flags ? this.flags[flagKey] : defaultValue;
  }

  variationDetail(flagKey: string, defaultValue: any): { value: any; variationId: string; reason: string; ruleIndex?: number } {
    if (this.details[flagKey]) return this.details[flagKey];
    return {
      value: this.variation(flagKey, defaultValue),
      variationId: '',
      reason: flagKey in this.flags ? 'FALLTHROUGH' : 'DEFAULT',
    };
  }

  allFlags(): Record<string, any> {
    return { ...this.flags };
  }

  async identify(newContext: FFContext): Promise<void> {
    this.context = newContext;
    await this.fetchFlags().catch(() => {});
  }

  on(event: string, callback: Function): void {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event].add(callback as Listener);
  }

  off(event: string, callback: Function): void {
    this.listeners[event]?.delete(callback as Listener);
  }

  track(key: string, data?: any, metricValue?: number): void {
    this.eventQueue.push({ kind: 'custom', key, data, metricValue, timestamp: Date.now() });
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0 || this.options.offline) return;
    const events = this.eventQueue.splice(0);
    const base = this.options.baseUrl || '';
    try {
      await fetch(`${base}/api/sdk/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': this.sdkKey },
        body: JSON.stringify({ events, context: this.context }),
      });
    } catch {
      // Re-queue on failure
      this.eventQueue.unshift(...events);
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  close(): void {
    this.eventSource?.close();
    this.eventSource = null;
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.pollingTimer = null;
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = null;
    this.flush().catch(() => {});
  }
}
