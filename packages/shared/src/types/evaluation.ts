export type EvaluationReason =
  | 'OFF'
  | 'TARGET_MATCH'
  | 'RULE_MATCH'
  | 'PREREQUISITE_FAILED'
  | 'FALLTHROUGH'
  | 'ERROR';

export interface EvaluationResult {
  value: any;
  variationId: string;
  reason: EvaluationReason;
  ruleIndex?: number;
  ruleId?: string;
  errorKind?: string;
}
