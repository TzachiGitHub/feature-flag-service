import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export interface FFContext {
  kind: string;
  key: string;
  name?: string;
  attributes?: Record<string, unknown>;
}

interface FlagDetail {
  value: unknown;
  variationId: string;
  reason: string;
}

interface FlagContextValue {
  flags: Record<string, unknown>;
  flagDetails: Record<string, FlagDetail>;
  ready: boolean;
  connected: boolean;
  connectionType: 'sse' | 'polling' | 'none';
  context: FFContext;
  identify: (ctx: FFContext) => void;
  refresh: () => void;
}

const FlagCtx = createContext<FlagContextValue>({
  flags: {},
  flagDetails: {},
  ready: false,
  connected: false,
  connectionType: 'none',
  context: { kind: 'user', key: 'anonymous' },
  identify: () => {},
  refresh: () => {},
});

function encodeContext(ctx: FFContext): string {
  return btoa(JSON.stringify(ctx));
}

export function FlagProvider({
  sdkKey,
  context: initialContext,
  children,
}: {
  sdkKey: string;
  context: FFContext;
  children: React.ReactNode;
}) {
  const [ctx, setCtx] = useState<FFContext>(initialContext);
  const [flags, setFlags] = useState<Record<string, unknown>>({});
  const [flagDetails, setFlagDetails] = useState<Record<string, FlagDetail>>({});
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'sse' | 'polling' | 'none'>('none');
  const esRef = useRef<EventSource | null>(null);

  const fetchFlags = useCallback(
    async (context: FFContext) => {
      try {
        const res = await fetch(`/api/sdk/flags?context=${encodeContext(context)}`, {
          headers: { Authorization: sdkKey },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const newFlags: Record<string, unknown> = {};
        const newDetails: Record<string, FlagDetail> = {};
        const flagsData = (data as any).flags || data;
        if (flagsData && typeof flagsData === 'object') {
          for (const [key, val] of Object.entries(flagsData as Record<string, unknown>)) {
            const v = val as Record<string, unknown> | undefined;
            if (v && typeof v === 'object' && 'value' in v) {
              newFlags[key] = v.value;
              newDetails[key] = {
                value: v.value,
                variationId: (v.variationId as string) || '',
                reason: (v.reason as string) || 'UNKNOWN',
              };
            } else {
              newFlags[key] = val;
              newDetails[key] = { value: val, variationId: '', reason: 'UNKNOWN' };
            }
          }
        }
        setFlags(newFlags);
        setFlagDetails(newDetails);
        setReady(true);
      } catch {
        // keep existing flags on error
        setReady(true);
      }
    },
    [sdkKey]
  );

  const connectSSE = useCallback(
    (context: FFContext) => {
      if (esRef.current) {
        esRef.current.close();
      }
      try {
        const url = `/api/sdk/stream?context=${encodeContext(context)}&authorization=${encodeURIComponent(sdkKey)}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.onopen = () => {
          setConnected(true);
          setConnectionType('sse');
        };

        es.addEventListener('put', () => {
          // SSE may send raw definitions; safest to re-fetch evaluated flags
          fetchFlags(context);
        });

        es.addEventListener('patch', () => {
          // Re-fetch all flags to get properly evaluated values
          fetchFlags(context);
        });

        es.onerror = () => {
          setConnected(false);
          setConnectionType('polling');
        };
      } catch {
        setConnected(false);
        setConnectionType('none');
      }
    },
    [sdkKey, fetchFlags]
  );

  const identify = useCallback(
    (newCtx: FFContext) => {
      setCtx(newCtx);
      fetchFlags(newCtx);
      connectSSE(newCtx);
    },
    [fetchFlags, connectSSE]
  );

  const refresh = useCallback(() => {
    fetchFlags(ctx);
  }, [fetchFlags, ctx]);

  useEffect(() => {
    fetchFlags(ctx);
    connectSSE(ctx);
    return () => {
      esRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FlagCtx.Provider value={{ flags, flagDetails, ready, connected, connectionType, context: ctx, identify, refresh }}>
      {children}
    </FlagCtx.Provider>
  );
}

export function useFlag<T>(key: string, defaultValue: T): T {
  const { flags } = useContext(FlagCtx);
  return key in flags ? (flags[key] as T) : defaultValue;
}

export function useFlagDetail(key: string, defaultValue: unknown) {
  const { flagDetails, ready } = useContext(FlagCtx);
  if (key in flagDetails) return { ...flagDetails[key], ready };
  return { value: defaultValue, variationId: '', reason: ready ? 'FLAG_NOT_FOUND' : 'NOT_READY', ready };
}

export function useFlags() {
  return useContext(FlagCtx).flags;
}

export function useFlagContext() {
  return useContext(FlagCtx);
}
