import type { Segment, Context } from './types.js';
import { matchesRule } from './rules.js';

export function isInSegment(segment: Segment, context: Context): boolean {
  if (segment.excluded.includes(context.key)) return false;
  if (segment.included.includes(context.key)) return true;
  for (const rule of segment.rules) {
    if (matchesRule(rule, context)) return true;
  }
  return false;
}
