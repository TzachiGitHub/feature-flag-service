export interface Context {
  kind: string;
  key: string;
  name?: string;
  attributes: Record<string, any>;
}

export interface MultiContext {
  kind: 'multi';
  contexts: Record<string, Context>;
}
