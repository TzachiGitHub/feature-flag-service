import React from 'react';
import { renderHook } from '@testing-library/react';
import { FlagContext, FlagContextValue, IFeatureFlagClient } from '../context';
import { useFlag, useFlags, useFlagWithDetail, useFlagClient } from '../hooks';

function createMockClient(flags: Record<string, any> = {}): IFeatureFlagClient {
  return {
    variation: (key: string, def: any) => (key in flags ? flags[key] : def),
    variationDetail: (key: string, def: any) => ({
      value: key in flags ? flags[key] : def,
      variationId: 'var-1',
      reason: 'FALLTHROUGH',
    }),
    allFlags: () => ({ ...flags }),
    identify: async () => {},
    on: () => {},
    off: () => {},
    track: () => {},
    flush: async () => {},
    isReady: () => true,
    close: () => {},
  };
}

function wrapper(value: FlagContextValue) {
  return ({ children }: { children: React.ReactNode }) => (
    <FlagContext.Provider value={value}>{children}</FlagContext.Provider>
  );
}

describe('useFlag', () => {
  it('returns flag value when ready', () => {
    const flags = { 'dark-mode': true, 'limit': 50 };
    const { result } = renderHook(() => useFlag('dark-mode', false), {
      wrapper: wrapper({ client: createMockClient(flags), flags, ready: true }),
    });
    expect(result.current).toBe(true);
  });

  it('returns default when flag missing', () => {
    const flags = {};
    const { result } = renderHook(() => useFlag('missing', 'default'), {
      wrapper: wrapper({ client: createMockClient(flags), flags, ready: true }),
    });
    expect(result.current).toBe('default');
  });

  it('returns default when not ready', () => {
    const { result } = renderHook(() => useFlag('dark-mode', false), {
      wrapper: wrapper({ client: null, flags: {}, ready: false }),
    });
    expect(result.current).toBe(false);
  });
});

describe('useFlags', () => {
  it('returns all flags', () => {
    const flags = { a: 1, b: 'hello' };
    const { result } = renderHook(() => useFlags(), {
      wrapper: wrapper({ client: createMockClient(flags), flags, ready: true }),
    });
    expect(result.current).toEqual({ a: 1, b: 'hello' });
  });
});

describe('useFlagWithDetail', () => {
  it('returns detail when ready', () => {
    const flags = { feat: 'on' };
    const client = createMockClient(flags);
    const { result } = renderHook(() => useFlagWithDetail('feat', 'off'), {
      wrapper: wrapper({ client, flags, ready: true }),
    });
    expect(result.current.value).toBe('on');
    expect(result.current.variationId).toBe('var-1');
    expect(result.current.reason).toBe('FALLTHROUGH');
    expect(result.current.ready).toBe(true);
  });

  it('returns default when not ready', () => {
    const { result } = renderHook(() => useFlagWithDetail('feat', 'off'), {
      wrapper: wrapper({ client: null, flags: {}, ready: false }),
    });
    expect(result.current.value).toBe('off');
    expect(result.current.ready).toBe(false);
  });
});

describe('useFlagClient', () => {
  it('returns client', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useFlagClient(), {
      wrapper: wrapper({ client, flags: {}, ready: true }),
    });
    expect(result.current).toBe(client);
  });

  it('returns null when no client', () => {
    const { result } = renderHook(() => useFlagClient(), {
      wrapper: wrapper({ client: null, flags: {}, ready: false }),
    });
    expect(result.current).toBeNull();
  });
});
