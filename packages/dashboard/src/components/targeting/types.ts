export interface Variation {
  id: string;
  value: any;
  name: string;
}

export interface IndividualTarget {
  contextKind: string;
  variationId: string;
  values: string[];
}

export interface Clause {
  contextKind?: string;
  attribute: string;
  op: string;
  values: string[];
  negate: boolean;
}

export interface Rollout {
  variations: Array<{ variationId: string; weight: number }>;
  bucketBy?: string;
}

export interface TargetingRule {
  id: string;
  description: string;
  clauses: Clause[];
  serve?: {
    variationId?: string;
    rollout?: Rollout;
  };
}

export interface Prerequisite {
  flagKey: string;
  variationId: string;
}

export interface TargetingConfig {
  on: boolean;
  targets: IndividualTarget[];
  rules: TargetingRule[];
  fallthrough: {
    variationId?: string;
    rollout?: Rollout;
  };
  offVariation?: string;
  prerequisites: Prerequisite[];
}

export interface Segment {
  key: string;
  name: string;
  description?: string;
  included: string[];
  excluded: string[];
  rules: TargetingRule[];
  createdAt?: string;
  updatedAt?: string;
}

export const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'notEquals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
  { value: 'in', label: 'is one of' },
  { value: 'matches', label: 'matches regex' },
  { value: 'greaterThan', label: 'greater than' },
  { value: 'lessThan', label: 'less than' },
  { value: 'greaterThanOrEqual', label: '≥' },
  { value: 'lessThanOrEqual', label: '≤' },
  { value: 'semverEqual', label: 'semver =' },
  { value: 'semverGreaterThan', label: 'semver >' },
  { value: 'semverLessThan', label: 'semver <' },
] as const;

export const MULTI_VALUE_OPS = ['equals', 'notEquals', 'in'];
export const NUMERIC_OPS = ['greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'];
export const SEMVER_OPS = ['semverEqual', 'semverGreaterThan', 'semverLessThan'];
export const SINGLE_VALUE_OPS = ['contains', 'startsWith', 'endsWith', 'matches'];

export const ROLLOUT_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-purple-500',
];

export const ROLLOUT_DOT_COLORS = [
  'bg-indigo-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-cyan-400',
  'bg-purple-400',
];

export const CONTEXT_KINDS = ['user', 'device', 'organization'];
export const COMMON_ATTRIBUTES = ['key', 'name', 'email', 'country', 'plan', 'version'];
