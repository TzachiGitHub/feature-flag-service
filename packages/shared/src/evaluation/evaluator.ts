import type {
  FlagForEvaluation, Context, MultiContext, Segment,
  EvaluationResult, EvaluationReason
} from './types.js';
import { matchesRule } from './rules.js';
import { bucketContext } from './rollout.js';
import { checkPrerequisites } from './prerequisites.js';

function isMultiContext(ctx: Context | MultiContext): ctx is MultiContext {
  return ctx.kind === 'multi';
}

function resolveContext(ctx: Context | MultiContext, contextKind?: string): Context | undefined {
  if (!isMultiContext(ctx)) return ctx;
  const kind = contextKind || 'user';
  return ctx.contexts[kind];
}

function findVariation(flag: FlagForEvaluation, variationId: string) {
  return flag.variations.find(v => v.id === variationId);
}

function offResult(flag: FlagForEvaluation, reason: EvaluationReason): EvaluationResult {
  const v = findVariation(flag, flag.offVariationId || '');
  return {
    value: v?.value ?? null,
    variationId: flag.offVariationId || '',
    reason,
  };
}

export function evaluate(
  flag: FlagForEvaluation,
  context: Context | MultiContext,
  allFlags?: Map<string, FlagForEvaluation>,
  segments?: Map<string, Segment>
): EvaluationResult {
  try {
    // 1. Flag off
    if (!flag.on) {
      return offResult(flag, 'OFF');
    }

    // Resolve default context for non-clause operations
    const defaultCtx = resolveContext(context);
    if (!defaultCtx) {
      return { value: null, variationId: '', reason: 'ERROR', errorKind: 'NO_CONTEXT' };
    }

    // 2. Prerequisites
    if (flag.prerequisites.length > 0 && allFlags) {
      const prereqResult = checkPrerequisites(flag, allFlags, defaultCtx, segments);
      if (!prereqResult.met) {
        const result = offResult(flag, 'PREREQUISITE_FAILED');
        if (prereqResult.error) result.errorKind = prereqResult.error;
        return result;
      }
    }

    // 3. Individual targets
    for (const target of flag.targets) {
      const ctx = resolveContext(context, target.contextKind);
      if (ctx && target.values.includes(ctx.key)) {
        const v = findVariation(flag, target.variationId);
        return {
          value: v?.value ?? null,
          variationId: target.variationId,
          reason: 'TARGET_MATCH',
        };
      }
    }

    // 4. Rules
    for (let i = 0; i < flag.rules.length; i++) {
      const rule = flag.rules[i];
      // For multi-context, try to resolve the right context per clause contextKind
      const ruleCtx = rule.clauses.length > 0 && rule.clauses[0].contextKind
        ? resolveContext(context, rule.clauses[0].contextKind) || defaultCtx
        : defaultCtx;

      if (matchesRule(rule, ruleCtx, segments)) {
        let variationId: string;
        if (rule.rollout) {
          variationId = bucketContext(flag.key, rule.rollout, ruleCtx);
        } else {
          variationId = rule.variationId || '';
        }
        const v = findVariation(flag, variationId);
        return {
          value: v?.value ?? null,
          variationId,
          reason: 'RULE_MATCH',
          ruleIndex: i,
          ruleId: rule.id,
        };
      }
    }

    // 5. Fallthrough
    let variationId: string;
    if (flag.fallthrough.rollout) {
      variationId = bucketContext(flag.key, flag.fallthrough.rollout, defaultCtx);
    } else {
      variationId = flag.fallthrough.variationId || '';
    }
    const v = findVariation(flag, variationId);
    return {
      value: v?.value ?? null,
      variationId,
      reason: 'FALLTHROUGH',
    };
  } catch (e) {
    return { value: null, variationId: '', reason: 'ERROR', errorKind: 'EXCEPTION' };
  }
}
