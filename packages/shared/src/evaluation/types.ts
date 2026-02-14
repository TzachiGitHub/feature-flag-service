export type Operator = 'eq' | 'neq' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'matches' | 'gt' | 'lt' | 'gte' | 'lte' | 'semverEq' | 'semverGt' | 'semverLt';

export interface Clause {
  attribute: string;
  op: Operator;
  values: any[];
  negate?: boolean;
  contextKind?: string;
}

export interface WeightedVariation {
  variationId: string;
  weight: number;
}

export interface Rollout {
  variations: WeightedVariation[];
  bucketBy?: string;
}

export interface TargetingRule {
  id: string;
  clauses: Clause[];
  variationId?: string;
  rollout?: Rollout;
  description?: string;
  ref?: string;
}

export interface IndividualTarget {
  contextKind: string;
  variationId: string;
  values: string[];
}

export interface Fallthrough {
  variationId?: string;
  rollout?: Rollout;
}

export interface Variation {
  id: string;
  value: any;
  name: string;
  description?: string;
}

export interface FlagForEvaluation {
  key: string;
  type: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';
  variations: Variation[];
  on: boolean;
  offVariationId?: string;
  fallthrough: Fallthrough;
  targets: IndividualTarget[];
  rules: TargetingRule[];
  prerequisites: Array<{ flagKey: string; variationId: string }>;
  salt?: string;
}

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

export type EvaluationReason = 'OFF' | 'TARGET_MATCH' | 'RULE_MATCH' | 'PREREQUISITE_FAILED' | 'FALLTHROUGH' | 'ERROR';

export interface EvaluationResult {
  value: any;
  variationId: string;
  reason: EvaluationReason;
  ruleIndex?: number;
  ruleId?: string;
  errorKind?: string;
}

export interface Segment {
  key: string;
  rules: TargetingRule[];
  included: string[];
  excluded: string[];
}
