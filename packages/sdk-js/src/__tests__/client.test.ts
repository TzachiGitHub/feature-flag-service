import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlagClient } from '../client';

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  readyState = MockEventSource.OPEN;
  onmessage: any = null;
  onerror: any = null;
  private handlers: Record<string, Function[]> = {};
  addEventListener = vi.fn((event: string, handler: Function) => {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  });
  close = vi.fn();
  emit(event: string, data: any) {
    (this.handlers[event] || []).forEach(h => h({ data: JSON.stringify(data) }));
  }
}

describe('FeatureFlagClient', () => {
  let lastES: MockEventSource;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        flags: {
          'dark-mode': { value: true, variationId: 'v1', reason: 'FALLTHROUGH' },
          'banner-text': { value: 'hello', variationId: 'v2', reason: 'RULE', ruleIndex: 0 },
        },
      }),
    }) as any;

    (globalThis as any).EventSource = class extends MockEventSource {
      constructor() { super(); lastES = this; }
    };

    // Mock localStorage
    const storage: Record<string, string> = {};
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn((k: string) => storage[k] ?? null),
        setItem: vi.fn((k: string, v: string) => { storage[k] = v; }),
        removeItem: vi.fn((k: string) => { delete storage[k]; }),
      },
      writable: true,
      configurable: true,
    });
  });

  it('creates client with bootstrap data and returns values immediately', () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' }, {
      bootstrap: { 'dark-mode': true, 'banner-text': 'hi' },
      offline: true,
    });
    expect(client.variation('dark-mode', false)).toBe(true);
    expect(client.variation('banner-text', '')).toBe('hi');
    expect(client.isReady()).toBe(true);
  });

  it('variation returns default when flag does not exist', () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' }, { offline: true });
    expect(client.variation('nonexistent', 42)).toBe(42);
  });

  it('variationDetail returns full detail object', async () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' }, { streaming: false });
    await client.initialize();
    const detail = client.variationDetail('dark-mode', false);
    expect(detail).toEqual({ value: true, variationId: 'v1', reason: 'FALLTHROUGH' });
  });

  it('variationDetail returns default detail when flag missing', () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' }, { offline: true });
    const detail = client.variationDetail('nope', 'def');
    expect(detail).toEqual({ value: 'def', variationId: '', reason: 'DEFAULT' });
  });

  it('allFlags returns all values', async () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' }, { streaming: false });
    await client.initialize();
    expect(client.allFlags()).toEqual({ 'dark-mode': true, 'banner-text': 'hello' });
  });

  it('on change fires when flags update via SSE put', async () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' });
    await client.initialize();

    const cb = vi.fn();
    client.on('change', cb);

    // Simulate SSE put with changed value
    lastES.emit('put', {
      flags: {
        'dark-mode': { value: false, variationId: 'v3', reason: 'OFF' },
        'banner-text': { value: 'hello', variationId: 'v2', reason: 'RULE', ruleIndex: 0 },
      },
    });

    expect(cb).toHaveBeenCalledWith('dark-mode', false, true);
    expect(cb).toHaveBeenCalledTimes(1); // banner-text didn't change
  });

  it('on change:specific-flag only fires for that flag', async () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' });
    await client.initialize();

    const cb = vi.fn();
    client.on('change:banner-text', cb);

    lastES.emit('put', {
      flags: {
        'dark-mode': { value: false, variationId: 'v3', reason: 'OFF' },
        'banner-text': { value: 'world', variationId: 'v4', reason: 'RULE' },
      },
    });

    expect(cb).toHaveBeenCalledWith('banner-text', 'world', 'hello');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('identify re-fetches and emits changes', async () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' }, { streaming: false });
    await client.initialize();

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        flags: { 'dark-mode': { value: false, variationId: 'v5', reason: 'TARGET' } },
      }),
    });

    const cb = vi.fn();
    client.on('change', cb);
    await client.identify({ kind: 'user', key: 'u2' });

    expect(cb).toHaveBeenCalledWith('dark-mode', false, true);
  });

  it('close cleans up resources', async () => {
    const client = new FeatureFlagClient('sdk-key', { kind: 'user', key: 'u1' });
    await client.initialize();
    client.close();
    expect(lastES.close).toHaveBeenCalled();
  });
});
