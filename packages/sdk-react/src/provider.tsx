import React, { useEffect, useState, useRef, useMemo } from 'react';
import { FlagContext, IFeatureFlagClient } from './context';
import { LightweightClient } from './lightweight-client';

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

export interface FlagProviderProps {
  /** SDK key for authentication */
  sdkKey: string;
  /** Evaluation context (user/device) */
  context: FFContext;
  /** SDK options */
  options?: FFOptions;
  /** Inject a pre-built client (e.g. from @feature-flag/sdk-js). If provided, sdkKey/options are ignored. */
  client?: IFeatureFlagClient;
  children: React.ReactNode;
}

/**
 * Provides feature flag context to the React tree.
 * Either creates a lightweight built-in client or accepts an injected client.
 */
export function FlagProvider({ sdkKey, context, options, client: externalClient, children }: FlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, any>>(options?.bootstrap || {});
  const [ready, setReady] = useState(!!options?.bootstrap);
  const clientRef = useRef<IFeatureFlagClient | null>(null);
  const contextRef = useRef(context);

  // Create or use external client
  useEffect(() => {
    let client: IFeatureFlagClient;
    let isOwned = false;

    if (externalClient) {
      client = externalClient;
    } else {
      const lc = new LightweightClient(sdkKey, context, options);
      client = lc;
      isOwned = true;
      lc.initialize().catch(() => {});
    }

    clientRef.current = client;

    const onReady = () => {
      setReady(true);
      setFlags(client.allFlags());
    };

    const onChange = () => {
      setFlags(client.allFlags());
    };

    if (client.isReady()) {
      setReady(true);
      setFlags(client.allFlags());
    }

    client.on('ready', onReady);
    client.on('change', onChange);

    return () => {
      client.off('ready', onReady);
      client.off('change', onChange);
      if (isOwned) client.close();
      clientRef.current = null;
    };
  }, [sdkKey, externalClient]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle context changes → re-identify
  useEffect(() => {
    if (
      clientRef.current &&
      ready &&
      JSON.stringify(context) !== JSON.stringify(contextRef.current)
    ) {
      contextRef.current = context;
      clientRef.current.identify(context).then(() => {
        setFlags(clientRef.current!.allFlags());
      }).catch(() => {});
    }
  }, [context, ready]);

  const value = useMemo(() => ({
    client: clientRef.current,
    flags,
    ready,
  }), [flags, ready]);

  return (
    <FlagContext.Provider value={value}>
      {children}
    </FlagContext.Provider>
  );
}
