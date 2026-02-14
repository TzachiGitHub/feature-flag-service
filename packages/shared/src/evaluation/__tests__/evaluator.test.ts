import { describe, it, expect } from 'vitest';
import { evaluate } from '../evaluator.js';
import type { FlagForEvaluation, Context, MultiContext, Segment } from '../types.js';

const ctx: Context = { kind: 'user', key: 'user1', attributes: { country: 'US' } };

function makeFlag(overrides: Partial<FlagForEvaluation> = {}): FlagForEvaluation {
  return {
    key: 'test-flag',
    type: 'BOOLEAN',
    variations: [
      { id: 'true', value: true, name: 'True' },
      { id: 'false', value: false, name: 'False' },
    ],
    on: true,
    offVariationId: 'false',
    fallthrough: { variationId: 'true' },
    targets: [],
    rules: [],
    prerequisites: [],
    ...overrides,
  };
}

describe('evaluate', () => {
  it('flag OFF → returns off variation', () => {
    const result = evaluate(makeFlag({ on: false }), ctx);
    expect(result.value).toBe(false);
    expect(result.reason).toBe('OFF');
  });

  it('flag ON, no rules → returns fallthrough', () => {
    const result = evaluate(makeFlag(), ctx);
    expect(result.value).toBe(true);
    expect(result.reason).toBe('FALLTHROUGH');
  });

  it('individual target match', () => {
    const flag = makeFlag({
      targets: [{ contextKind: 'user', variationId: 'false', values: ['user1'] }],
    });
    const result = evaluate(flag, ctx);
    expect(result.value).toBe(false);
    expect(result.reason).toBe('TARGET_MATCH');
  });

  it('rule match', () => {
    const flag = makeFlag({
      rules: [{
        id: 'r1',
        clauses: [{ attribute: 'country', op: 'eq', values: ['US'] }],
        variationId: 'false',
      }],
    });
    const result = evaluate(flag, ctx);
    expect(result.value).toBe(false);
    expect(result.reason).toBe('RULE_MATCH');
    expect(result.ruleId).toBe('r1');
    expect(result.ruleIndex).toBe(0);
  });

  it('rule with rollout', () => {
    const flag = makeFlag({
      rules: [{
        id: 'r1',
        clauses: [{ attribute: 'country', op: 'eq', values: ['US'] }],
        rollout: { variations: [{ variationId: 'true', weight: 100000 }] },
      }],
    });
    const result = evaluate(flag, ctx);
    expect(result.value).toBe(true);
    expect(result.reason).toBe('RULE_MATCH');
  });

  it('fallthrough with rollout', () => {
    const flag = makeFlag({
      fallthrough: { rollout: { variations: [{ variationId: 'false', weight: 100000 }] } },
    });
    const result = evaluate(flag, ctx);
    expect(result.value).toBe(false);
    expect(result.reason).toBe('FALLTHROUGH');
  });

  it('prerequisite met → evaluates normally', () => {
    const flagA = makeFlag({ key: 'a', prerequisites: [{ flagKey: 'b', variationId: 'true' }] });
    const flagB = makeFlag({ key: 'b' });
    const allFlags = new Map([['a', flagA], ['b', flagB]]);
    const result = evaluate(flagA, ctx, allFlags);
    expect(result.reason).toBe('FALLTHROUGH');
    expect(result.value).toBe(true);
  });

  it('prerequisite not met → off variation', () => {
    const flagA = makeFlag({ key: 'a', prerequisites: [{ flagKey: 'b', variationId: 'true' }] });
    const flagB = makeFlag({ key: 'b', on: false });
    const allFlags = new Map([['a', flagA], ['b', flagB]]);
    const result = evaluate(flagA, ctx, allFlags);
    expect(result.reason).toBe('PREREQUISITE_FAILED');
  });

  it('prerequisite cycle → error in result', () => {
    const flagA = makeFlag({ key: 'a', prerequisites: [{ flagKey: 'b', variationId: 'true' }] });
    const flagB = makeFlag({ key: 'b', prerequisites: [{ flagKey: 'a', variationId: 'true' }] });
    const allFlags = new Map([['a', flagA], ['b', flagB]]);
    const result = evaluate(flagA, ctx, allFlags);
    expect(result.reason).toBe('PREREQUISITE_FAILED');
  });

  it('multi-context evaluation', () => {
    const multiCtx: MultiContext = {
      kind: 'multi',
      contexts: {
        user: { kind: 'user', key: 'user1', attributes: { country: 'US' } },
        org: { kind: 'org', key: 'org1', attributes: { plan: 'enterprise' } },
      },
    };
    const flag = makeFlag({
      targets: [{ contextKind: 'org', variationId: 'false', values: ['org1'] }],
    });
    const result = evaluate(flag, multiCtx);
    expect(result.value).toBe(false);
    expect(result.reason).toBe('TARGET_MATCH');
  });

  it('multi-context fallback to user', () => {
    const multiCtx: MultiContext = {
      kind: 'multi',
      contexts: {
        user: { kind: 'user', key: 'user1', attributes: {} },
      },
    };
    const result = evaluate(makeFlag(), multiCtx);
    expect(result.reason).toBe('FALLTHROUGH');
    expect(result.value).toBe(true);
  });

  it('first matching rule wins', () => {
    const flag = makeFlag({
      rules: [
        { id: 'r1', clauses: [{ attribute: 'country', op: 'eq', values: ['US'] }], variationId: 'false' },
        { id: 'r2', clauses: [{ attribute: 'country', op: 'eq', values: ['US'] }], variationId: 'true' },
      ],
    });
    const result = evaluate(flag, ctx);
    expect(result.ruleId).toBe('r1');
  });

  it('non-matching rule falls through', () => {
    const flag = makeFlag({
      rules: [{ id: 'r1', clauses: [{ attribute: 'country', op: 'eq', values: ['UK'] }], variationId: 'false' }],
    });
    const result = evaluate(flag, ctx);
    expect(result.reason).toBe('FALLTHROUGH');
  });
});
