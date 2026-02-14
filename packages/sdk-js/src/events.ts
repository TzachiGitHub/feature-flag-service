import type { FFContext, FFEvent } from './types';

export class EventManager {
  private buffer: FFEvent[] = [];
  private baseUrl: string;
  private sdkKey: string;
  private flushInterval: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private maxBufferSize = 100;

  constructor(baseUrl: string, sdkKey: string, flushIntervalMs: number) {
    this.baseUrl = baseUrl;
    this.sdkKey = sdkKey;
    this.flushInterval = flushIntervalMs;
  }

  trackEvaluation(flagKey: string, variationId: string, value: any, context: FFContext): void {
    this.buffer.push({
      kind: 'evaluation',
      flagKey,
      variationId,
      value,
      contextKey: context.key,
      contextKind: context.kind,
      timestamp: Date.now(),
    });
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  trackCustom(key: string, context: FFContext, data?: any, metricValue?: number): void {
    this.buffer.push({
      kind: 'custom',
      key,
      contextKey: context.key,
      contextKind: context.kind,
      data,
      value: metricValue,
      timestamp: Date.now(),
    });
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];
    try {
      const res = await fetch(`${this.baseUrl}/api/sdk/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.sdkKey,
        },
        body: JSON.stringify({ events }),
      });
      if (!res.ok) {
        // put events back for retry
        this.buffer = events.concat(this.buffer);
      }
    } catch {
      this.buffer = events.concat(this.buffer);
    }
  }

  flushBeacon(): void {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          `${this.baseUrl}/api/sdk/events`,
          JSON.stringify({ events })
        );
      }
    } catch {
      // best effort
    }
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }

  getBufferSize(): number {
    return this.buffer.length;
  }
}
