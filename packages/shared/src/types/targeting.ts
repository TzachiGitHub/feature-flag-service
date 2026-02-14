export type Operator =
  | 'eq' | 'neq' | 'contains' | 'startsWith' | 'endsWith'
  | 'in' | 'matches'
  | 'gt' | 'lt' | 'gte' | 'lte'
  | 'semverEq' | 'semverGt' | 'semverLt';

export interface Clause {
  attribute: string;
  op: Operator;
  values: any[];
  negate?: boolean;
  contextKind?: string;
}

export interface WeightedVariation {
  variationId: string;
  weight: number; // 0-100000
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

export interface FlagEnvironmentConfig {
  id: string;
  flagId: string;
  environmentId: string;
  on: boolean;
  offVariationId?: string;
  fallthrough: Fallthrough;
  targets: IndividualTarget[];
  rules: TargetingRule[];
  version: number;
  updatedAt: string;
}

export interface Prerequisite {
  flagKey: string;
  variationId: string;
}
