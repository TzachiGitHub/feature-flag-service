import type { FFContext, FFOptions, FFVariationDetail, FFEventCallback, FFReadyCallback } from './types';
import { SSEStream } from './stream';
import { EventManager } from './events';
import { FlagStore } from './store';

const DEFAULT_OPTIONS: Required<FFOptions> = {
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3020',
  streaming: true,
  pollingInterval: 30000,
  flushInterval: 30000,
  bootstrap: {},
  offline: false,
  storageKey: 'ff-flags',
};

export class FeatureFlagClient {
  private sdkKey: string;
  private context: FFContext;
  private options: Required<FFOptions>;
  private flags: Map<string, FFVariationDetail> = new Map();
  private flagDefinitions: Map<string, any> = new Map();
  private listeners: Map<string, Set<FFEventCallback>> = new Map();
  private readyListeners: Set<FFReadyCallback> = new Set();
  private stream: SSEStream | null = null;
  private eventManager: EventManager;
  private store: FlagStore;
  private ready = false;
  private readyPromise: Promise<void>;
  private readyResolve: (() => void) | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(sdkKey: string, context: FFContext, options?: FFOptions) {
    this.sdkKey = sdkKey;
    this.context = context;
    this.options = { ...DEFAULT_OPTIONS, ...options } as Required<FFOptions>;
    this.store = new FlagStore(this.options.storageKey);
    this.eventManager = new EventManager(this.options.baseUrl, sdkKey, this.options.flushInterval);

    this.readyPromise = new Promise<void>((resolve) => {
      this.readyResolve = resolve;
    });

    // Apply bootstrap
    if (this.options.bootstrap && Object.keys(this.options.bootstrap).length > 0) {
      for (const [key, value] of Object.entries(this.options.bootstrap)) {
        this.flags.set(key, {
          value,
          variationId: 'bootstrap',
          reason: 'BOOTSTRAP',
        });
      }
      this.markReady();
    }

    // Load from localStorage as fallback
    if (!this.ready) {
      const cached = this.store.load();
      if (cached) {
        for (const [key, detail] of Object.entries(cached)) {
          this.flags.set(key, detail);
        }
      }
    }
  }

  private markReady(): void {
    if (this.ready) return;
    this.ready = true;
    this.readyResolve?.();
    this.readyListeners.forEach((cb) => {
      try { cb(); } catch { /* ignore */ }
    });
  }

  async initialize(): Promise<void> {
    if (this.options.offline) {
      this.markReady();
      return;
    }

    try {
      await this.fetchFlags();
    } catch {
      // If fetch fails and we have cached/bootstrap data, still mark ready
    }

    this.markReady();

    if (this.options.streaming) {
      this.startStream();
    } else {
      this.startPolling();
    }

    this.eventManager.start();
  }

  private async fetchFlags(): Promise<void> {
    const contextB64 = btoa(JSON.stringify(this.context));
    const res = await fetch(
      `${this.options.baseUrl}/api/sdk/flags?context=${encodeURIComponent(contextB64)}`,
      { headers: { Authorization: this.sdkKey } }
    );
    if (!res.ok) throw new Error(`Failed to fetch flags: ${res.status}`);
    const data = await res.json();
    this.processFlagData(data.flags || data);
  }

  private processFlagData(flagsData: Record<string, any>): void {
    const oldFlags = new Map(this.flags);

    for (const [key, flagData] of Object.entries(flagsData)) {
      if (flagData && typeof flagData === 'object' && 'value' in flagData) {
        this.flags.set(key, {
          value: flagData.value,
          variationId: flagData.variationId || flagData.variation?.toString() || '',
          reason: flagData.reason || 'SERVER',
          ruleIndex: flagData.ruleIndex,
        });
      } else {
        this.flags.set(key, {
          value: flagData,
          variationId: '',
          reason: 'SERVER',
        });
      }
    }

    // Persist
    if (!this.options.offline) {
      const toSave: Record<string, FFVariationDetail> = {};
      this.flags.forEach((v, k) => { toSave[k] = v; });
      this.store.save(toSave);
    }

    // Emit changes
    this.emitChanges(oldFlags);
  }

  private emitChanges(oldFlags: Map<string, FFVariationDetail>): void {
    for (const [key, detail] of this.flags) {
      const old = oldFlags.get(key);
      const oldValue = old?.value;
      const newValue = detail.value;
      if (oldValue !== newValue) {
        this.emit(`change:${key}`, key, newValue, oldValue);
        this.emit('change', key, newValue, oldValue);
      }
    }
  }

  private startStream(): void {
    this.stream?.disconnect();
    this.stream = new SSEStream(
      `${this.options.baseUrl}/api/sdk/stream`,
      this.sdkKey,
      {
        onPut: (data) => this.processFlagData(data.flags || data),
        onPatch: (data) => {
          if (data.key || data.flagKey) {
            const key = data.key || data.flagKey;
            const wrapped: Record<string, any> = {};
            wrapped[key] = data;
            this.processFlagData(wrapped);
          }
        },
        onError: () => { /* reconnect handled internally */ },
      }
    );
    this.stream.connect();
  }

  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      this.fetchFlags().catch(() => { /* ignore */ });
    }, this.options.pollingInterval);
  }

  variation(flagKey: string, defaultValue: any): any {
    const detail = this.flags.get(flagKey);
    const value = detail ? detail.value : defaultValue;

    if (!this.options.offline) {
      this.eventManager.trackEvaluation(
        flagKey,
        detail?.variationId || '',
        value,
        this.context
      );
    }

    return value;
  }

  variationDetail(flagKey: string, defaultValue: any): FFVariationDetail {
    const detail = this.flags.get(flagKey);
    if (!detail) {
      return { value: defaultValue, variationId: '', reason: 'DEFAULT' };
    }

    if (!this.options.offline) {
      this.eventManager.trackEvaluation(flagKey, detail.variationId, detail.value, this.context);
    }

    return { ...detail };
  }

  allFlags(): Record<string, any> {
    const result: Record<string, any> = {};
    this.flags.forEach((detail, key) => {
      result[key] = detail.value;
    });
    return result;
  }

  async identify(newContext: FFContext): Promise<void> {
    this.context = newContext;
    await this.eventManager.flush();

    if (!this.options.offline) {
      try {
        const oldFlags = new Map(this.flags);
        await this.fetchFlags();
        // Stream reconnect with new context
        if (this.options.streaming) {
          this.startStream();
        }
      } catch {
        // ignore
      }
    }
  }

  on(event: string, callback: FFEventCallback | FFReadyCallback): void {
    if (event === 'ready') {
      this.readyListeners.add(callback as FFReadyCallback);
      if (this.ready) {
        try { (callback as FFReadyCallback)(); } catch { /* ignore */ }
      }
      return;
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as FFEventCallback);
  }

  off(event: string, callback: FFEventCallback | FFReadyCallback): void {
    if (event === 'ready') {
      this.readyListeners.delete(callback as FFReadyCallback);
      return;
    }
    this.listeners.get(event)?.delete(callback as FFEventCallback);
  }

  private emit(event: string, flagKey: string, newValue: any, oldValue: any): void {
    this.listeners.get(event)?.forEach((cb) => {
      try { cb(flagKey, newValue, oldValue); } catch { /* ignore */ }
    });
  }

  async flush(): Promise<void> {
    await this.eventManager.flush();
  }

  track(key: string, data?: any, metricValue?: number): void {
    if (!this.options.offline) {
      this.eventManager.trackCustom(key, this.context, data, metricValue);
    }
  }

  waitForInitialization(): Promise<void> {
    return this.readyPromise;
  }

  isReady(): boolean {
    return this.ready;
  }

  close(): void {
    this.stream?.disconnect();
    this.stream = null;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.eventManager.flushBeacon();
    this.eventManager.stop();
    this.listeners.clear();
    this.readyListeners.clear();
  }
}
