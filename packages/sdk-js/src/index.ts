import { FeatureFlagClient } from './client';
import type { FFContext, FFOptions, FFVariationDetail, FFEvent, FFEventCallback } from './types';

export function initialize(sdkKey: string, context: FFContext, options?: FFOptions): FeatureFlagClient {
  const client = new FeatureFlagClient(sdkKey, context, options);
  client.initialize();
  return client;
}

export function createClient(sdkKey: string, context: FFContext, options?: FFOptions): FeatureFlagClient {
  return new FeatureFlagClient(sdkKey, context, options);
}

export { FeatureFlagClient };
export type { FFContext, FFOptions, FFVariationDetail, FFEvent, FFEventCallback };
export type { FFReadyCallback } from './types';
