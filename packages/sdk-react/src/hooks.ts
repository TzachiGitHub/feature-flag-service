import { useContext, useRef } from 'react';
import { FlagContext, IFeatureFlagClient } from './context';

/**
 * Get a single flag's value. Re-renders only when this specific flag changes.
 */
export function useFlag<T = any>(flagKey: string, defaultValue: T): T {
  const { flags, ready } = useContext(FlagContext);
  if (!ready) return defaultValue;
  return flagKey in flags ? flags[flagKey] : defaultValue;
}

/**
 * Get a flag's value with evaluation details.
 */
export function useFlagWithDetail<T = any>(flagKey: string, defaultValue: T): {
  value: T;
  variationId: string;
  reason: string;
  ruleIndex?: number;
  ready: boolean;
} {
  const { client, flags, ready } = useContext(FlagContext);

  if (!ready || !client) {
    return { value: defaultValue, variationId: '', reason: 'NOT_READY', ready: false };
  }

  const detail = client.variationDetail(flagKey, defaultValue);
  return {
    value: detail.value as T,
    variationId: detail.variationId,
    reason: detail.reason,
    ruleIndex: detail.ruleIndex,
    ready: true,
  };
}

/**
 * Get all flag values. Re-renders when any flag changes.
 */
export function useFlags(): Record<string, any> {
  const { flags } = useContext(FlagContext);
  return flags;
}

/**
 * Get the raw feature flag client for advanced usage.
 */
export function useFlagClient(): IFeatureFlagClient | null {
  const { client } = useContext(FlagContext);
  return client;
}
