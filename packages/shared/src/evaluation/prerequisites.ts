import type { FlagForEvaluation, Context, Segment, EvaluationResult } from './types.js';

// Forward declaration to avoid circular import - we'll use a simple inline evaluation
import { matchesRule } from './rules.js';
import { bucketContext } from './rollout.js';

export function checkPrerequisites(
  flag: FlagForEvaluation,
  allFlags: Map<string, FlagForEvaluation>,
  context: Context,
  segments?: Map<string, Segment>,
  visited?: Set<string>
): { met: boolean; error?: string } {
  if (!flag.prerequisites || flag.prerequisites.length === 0) {
    return { met: true };
  }

  const vis = visited ?? new Set<string>();
  vis.add(flag.key);

  for (const prereq of flag.prerequisites) {
    if (vis.has(prereq.flagKey)) {
      return { met: false, error: `Circular prerequisite detected: ${prereq.flagKey}` };
    }

    const prereqFlag = allFlags.get(prereq.flagKey);
    if (!prereqFlag) {
      return { met: false, error: `Prerequisite flag not found: ${prereq.flagKey}` };
    }

    // Recursively check prerequisites of the prerequisite
    const subResult = checkPrerequisites(prereqFlag, allFlags, context, segments, new Set(vis));
    if (!subResult.met) {
      return subResult;
    }

    // Evaluate the prerequisite flag simply
    const evalResult = evaluateFlagSimple(prereqFlag, context, allFlags, segments);
    if (evalResult.variationId !== prereq.variationId) {
      return { met: false };
    }
  }

  return { met: true };
}

/** Simple flag evaluation without prerequisite checking (to avoid infinite recursion) */
function evaluateFlagSimple(
  flag: FlagForEvaluation,
  context: Context,
  allFlags: Map<string, FlagForEvaluation>,
  segments?: Map<string, Segment>
): { variationId: string; value: any } {
  if (!flag.on) {
    const v = flag.variations.find(v => v.id === flag.offVariationId);
    return { variationId: flag.offVariationId || '', value: v?.value ?? null };
  }

  // Individual targets
  for (const target of flag.targets) {
    if (target.contextKind === context.kind && target.values.includes(context.key)) {
      const v = flag.variations.find(v => v.id === target.variationId);
      return { variationId: target.variationId, value: v?.value ?? null };
    }
  }

  // Rules
  for (const rule of flag.rules) {
    if (matchesRule(rule, context, segments)) {
      if (rule.rollout) {
        const varId = bucketContext(flag.key, rule.rollout, context);
        const v = flag.variations.find(v => v.id === varId);
        return { variationId: varId, value: v?.value ?? null };
      }
      const v = flag.variations.find(v => v.id === rule.variationId);
      return { variationId: rule.variationId || '', value: v?.value ?? null };
    }
  }

  // Fallthrough
  if (flag.fallthrough.rollout) {
    const varId = bucketContext(flag.key, flag.fallthrough.rollout, context);
    const v = flag.variations.find(v => v.id === varId);
    return { variationId: varId, value: v?.value ?? null };
  }
  const v = flag.variations.find(v => v.id === flag.fallthrough.variationId);
  return { variationId: flag.fallthrough.variationId || '', value: v?.value ?? null };
}
