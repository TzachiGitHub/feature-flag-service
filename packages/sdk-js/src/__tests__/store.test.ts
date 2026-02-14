import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlagStore } from '../store';

describe('FlagStore', () => {
  let store: FlagStore;
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
    };
    Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true, configurable: true });
    store = new FlagStore('ff-flags');
  });

  it('save and load roundtrips correctly', () => {
    const flags = {
      'flag-1': { value: true, variationId: 'v1', reason: 'RULE' },
      'flag-2': { value: 'hello', variationId: 'v2', reason: 'FALLTHROUGH' },
    };
    store.save(flags);
    expect(store.load()).toEqual(flags);
  });

  it('returns null when nothing stored', () => {
    expect(store.load()).toBeNull();
  });

  it('handles localStorage not available', () => {
    Object.defineProperty(globalThis, 'localStorage', { value: undefined, writable: true, configurable: true });
    const s = new FlagStore('ff-flags');
    expect(s.load()).toBeNull();
    // Should not throw
    s.save({ f: { value: 1, variationId: '', reason: '' } });
    s.clear();
  });
});
