import type { TargetingRule, Clause, Context, Segment } from './types.js';
import { isInSegment } from './segments.js';

export function matchesRule(rule: TargetingRule, context: Context, segments?: Map<string, Segment>): boolean {
  // Segment reference
  if (rule.ref && segments) {
    const segment = segments.get(rule.ref);
    if (!segment) return false;
    return isInSegment(segment, context);
  }

  // All clauses must match (AND)
  for (const clause of rule.clauses) {
    if (!matchesClause(clause, context, segments)) return false;
  }
  return true;
}

function parseSemver(v: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v));
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return NaN;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function matchesClause(clause: Clause, context: Context, segments?: Map<string, Segment>): boolean {
  // contextKind filter
  if (clause.contextKind && clause.contextKind !== context.kind) {
    return applyNegate(false, clause.negate);
  }

  const attrValue = clause.attribute === 'key' ? context.key
    : clause.attribute === 'kind' ? context.kind
    : clause.attribute === 'name' ? context.name
    : context.attributes[clause.attribute];

  const result = evaluateOp(clause.op, attrValue, clause.values);
  return applyNegate(result, clause.negate);
}

function applyNegate(result: boolean, negate?: boolean): boolean {
  return negate ? !result : result;
}

function evaluateOp(op: string, attrValue: any, values: any[]): boolean {
  if (attrValue === undefined || attrValue === null) {
    return op === 'neq';
  }

  switch (op) {
    case 'eq':
      return values.some(v => attrValue === v);
    case 'neq':
      return values.every(v => attrValue !== v);
    case 'contains':
      return values.some(v => String(attrValue).includes(String(v)));
    case 'startsWith':
      return values.some(v => String(attrValue).startsWith(String(v)));
    case 'endsWith':
      return values.some(v => String(attrValue).endsWith(String(v)));
    case 'in':
      return values.includes(attrValue);
    case 'matches':
      return values.some(v => {
        try { return new RegExp(v).test(String(attrValue)); } catch { return false; }
      });
    case 'gt':
    case 'lt':
    case 'gte':
    case 'lte': {
      const num = Number(attrValue);
      if (isNaN(num)) return false;
      return values.some(v => {
        const vn = Number(v);
        if (isNaN(vn)) return false;
        switch (op) {
          case 'gt': return num > vn;
          case 'lt': return num < vn;
          case 'gte': return num >= vn;
          case 'lte': return num <= vn;
          default: return false;
        }
      });
    }
    case 'semverEq':
      return values.some(v => compareSemver(String(attrValue), String(v)) === 0);
    case 'semverGt':
      return values.some(v => { const c = compareSemver(String(attrValue), String(v)); return !isNaN(c) && c > 0; });
    case 'semverLt':
      return values.some(v => { const c = compareSemver(String(attrValue), String(v)); return !isNaN(c) && c < 0; });
    default:
      return false;
  }
}
