import { createContext } from 'react';

export interface IFeatureFlagClient {
  variation(flagKey: string, defaultValue: any): any;
  variationDetail(flagKey: string, defaultValue: any): { value: any; variationId: string; reason: string; ruleIndex?: number };
  allFlags(): Record<string, any>;
  identify(newContext: { kind: string; key: string; name?: string; attributes?: Record<string, any> }): Promise<void>;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  track(key: string, data?: any, metricValue?: number): void;
  flush(): Promise<void>;
  isReady(): boolean;
  close(): void;
}

export interface FlagContextValue {
  client: IFeatureFlagClient | null;
  flags: Record<string, any>;
  ready: boolean;
}

export const FlagContext = createContext<FlagContextValue>({
  client: null,
  flags: {},
  ready: false,
});
