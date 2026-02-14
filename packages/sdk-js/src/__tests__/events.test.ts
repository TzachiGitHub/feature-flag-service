import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventManager } from '../events';

describe('EventManager', () => {
  let mgr: EventManager;
  const ctx = { kind: 'user', key: 'user-1' };

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }) as any;
    mgr = new EventManager('http://localhost:3020', 'sdk-key-123', 30000);
  });

  it('buffers evaluation events', () => {
    mgr.trackEvaluation('flag-1', 'v1', true, ctx);
    mgr.trackEvaluation('flag-2', 'v2', 'yes', ctx);
    expect(mgr.getBufferSize()).toBe(2);
  });

  it('trackEvaluation creates correct event shape', () => {
    mgr.trackEvaluation('my-flag', 'var-1', 42, ctx);
    // Flush to verify the event was sent
    mgr.flush();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3020/api/sdk/events',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"flagKey":"my-flag"'),
      })
    );
  });

  it('trackCustom creates correct event shape', () => {
    mgr.trackCustom('purchase', ctx, { item: 'hat' }, 9.99);
    mgr.flush();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3020/api/sdk/events',
      expect.objectContaining({
        body: expect.stringContaining('"key":"purchase"'),
      })
    );
  });

  it('flushes when buffer is full (100)', () => {
    for (let i = 0; i < 100; i++) {
      mgr.trackEvaluation(`flag-${i}`, 'v', true, ctx);
    }
    // auto-flush triggered at 100
    expect(fetch).toHaveBeenCalled();
  });

  it('does not flush when buffer is empty', async () => {
    await mgr.flush();
    expect(fetch).not.toHaveBeenCalled();
  });
});
