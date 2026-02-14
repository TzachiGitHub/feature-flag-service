import { describe, it, expect } from 'vitest';
import { checkPrerequisites } from '../prerequisites.js';
import type { FlagForEvaluation, Context } from '../types.js';

const ctx: Context = { kind: 'user', key: 'user1', attributes: {} };

function makeFlag(key: string, overrides: Partial<FlagForEvaluation> = {}): FlagForEvaluation {
  return {
    key,
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

describe('checkPrerequisites', () => {
  it('no prerequisites → met', () => {
    const flag = makeFlag('f1');
    expect(checkPrerequisites(flag, new Map(), ctx)).toEqual({ met: true });
  });

  it('single prerequisite met', () => {
    const flagA = makeFlag('a', { prerequisites: [{ flagKey: 'b', variationId: 'true' }] });
    const flagB = makeFlag('b');
    const allFlags = new Map([['a', flagA], ['b', flagB]]);
    expect(checkPrerequisites(flagA, allFlags, ctx).met).toBe(true);
  });

  it('single prerequisite not met', () => {
    const flagA = makeFlag('a', { prerequisites: [{ flagKey: 'b', variationId: 'true' }] });
    const flagB = makeFlag('b', { on: false }); // off → returns 'false' variation
    const allFlags = new Map([['a', flagA], ['b', flagB]]);
    expect(checkPrerequisites(flagA, allFlags, ctx).met).toBe(false);
  });

  it('chain: A requires B requires C', () => {
    const flagA = makeFlag('a', { prerequisites: [{ flagKey: 'b', variationId: 'true' }] });
    const flagB = makeFlag('b', { prerequisites: [{ flagKey: 'c', variationId: 'true' }] });
    const flagC = makeFlag('c');
    const allFlags = new Map([['a', flagA], ['b', flagB], ['c', flagC]]);
    expect(checkPrerequisites(flagA, allFlags, ctx).met).toBe(true);
  });

  it('circular dependency detected', () => {
    const flagA = makeFlag('a', { prerequisites: [{ flagKey: 'b', variationId: 'true' }] });
    const flagB = makeFlag('b', { prerequisites: [{ flagKey: 'a', variationId: 'true' }] });
    const allFlags = new Map([['a', flagA], ['b', flagB]]);
    const result = checkPrerequisites(flagA, allFlags, ctx);
    expect(result.met).toBe(false);
    expect(result.error).toContain('Circular');
  });

  it('missing prerequisite flag', () => {
    const flagA = makeFlag('a', { prerequisites: [{ flagKey: 'nonexistent', variationId: 'true' }] });
    const allFlags = new Map([['a', flagA]]);
    const result = checkPrerequisites(flagA, allFlags, ctx);
    expect(result.met).toBe(false);
    expect(result.error).toContain('not found');
  });
});
