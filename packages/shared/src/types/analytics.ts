export interface AnalyticsEvent {
  kind: 'evaluation' | 'custom';
  flagKey?: string;
  variationId?: string;
  contextKey: string;
  contextKind: string;
  value?: any;
  data?: any;
  timestamp: number;
}
