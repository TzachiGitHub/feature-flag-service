export interface FFContext {
  kind: string;
  key: string;
  name?: string;
  attributes?: Record<string, any>;
}

export interface FFOptions {
  baseUrl?: string;
  streaming?: boolean;
  pollingInterval?: number;
  flushInterval?: number;
  bootstrap?: Record<string, any>;
  offline?: boolean;
  storageKey?: string;
}

export interface FFVariationDetail {
  value: any;
  variationId: string;
  reason: string;
  ruleIndex?: number;
}

export interface FFEvent {
  kind: 'evaluation' | 'custom';
  key?: string;
  flagKey?: string;
  variationId?: string;
  value?: any;
  contextKey: string;
  contextKind: string;
  data?: any;
  timestamp: number;
}

export type FFEventCallback = (flagKey: string, newValue: any, oldValue: any) => void;
export type FFReadyCallback = () => void;
