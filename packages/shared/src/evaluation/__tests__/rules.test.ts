import { describe, it, expect } from 'vitest';
import { matchesClause, matchesRule } from '../rules.js';
import type { Clause, Context, TargetingRule, Segment } from '../types.js';

const ctx = (attrs: Record<string, any> = {}): Context => ({
  kind: 'user', key: 'user1', attributes: attrs,
});

describe('matchesClause', () => {
  it('eq - string match', () => {
    expect(matchesClause({ attribute: 'country', op: 'eq', values: ['US'] }, ctx({ country: 'US' }))).toBe(true);
  });
  it('eq - number match', () => {
    expect(matchesClause({ attribute: 'age', op: 'eq', values: [25] }, ctx({ age: 25 }))).toBe(true);
  });
  it('eq - no match', () => {
    expect(matchesClause({ attribute: 'country', op: 'eq', values: ['UK'] }, ctx({ country: 'US' }))).toBe(false);
  });
  it('neq', () => {
    expect(matchesClause({ attribute: 'country', op: 'neq', values: ['UK'] }, ctx({ country: 'US' }))).toBe(true);
    expect(matchesClause({ attribute: 'country', op: 'neq', values: ['US'] }, ctx({ country: 'US' }))).toBe(false);
  });
  it('contains', () => {
    expect(matchesClause({ attribute: 'email', op: 'contains', values: ['@gmail'] }, ctx({ email: 'a@gmail.com' }))).toBe(true);
    expect(matchesClause({ attribute: 'email', op: 'contains', values: ['@yahoo'] }, ctx({ email: 'a@gmail.com' }))).toBe(false);
  });
  it('startsWith', () => {
    expect(matchesClause({ attribute: 'displayName', op: 'startsWith', values: ['Jo'] }, ctx({ displayName: 'John' }))).toBe(true);
  });
  it('endsWith', () => {
    expect(matchesClause({ attribute: 'displayName', op: 'endsWith', values: ['hn'] }, ctx({ displayName: 'John' }))).toBe(true);
  });
  it('in', () => {
    expect(matchesClause({ attribute: 'country', op: 'in', values: ['US', 'UK', 'CA'] }, ctx({ country: 'UK' }))).toBe(true);
    expect(matchesClause({ attribute: 'country', op: 'in', values: ['US', 'CA'] }, ctx({ country: 'UK' }))).toBe(false);
  });
  it('matches - regex', () => {
    expect(matchesClause({ attribute: 'email', op: 'matches', values: ['^.*@example\\.com$'] }, ctx({ email: 'test@example.com' }))).toBe(true);
    expect(matchesClause({ attribute: 'email', op: 'matches', values: ['^admin'] }, ctx({ email: 'test@example.com' }))).toBe(false);
  });
  it('gt / lt / gte / lte', () => {
    expect(matchesClause({ attribute: 'age', op: 'gt', values: [18] }, ctx({ age: 25 }))).toBe(true);
    expect(matchesClause({ attribute: 'age', op: 'lt', values: [18] }, ctx({ age: 10 }))).toBe(true);
    expect(matchesClause({ attribute: 'age', op: 'gte', values: [18] }, ctx({ age: 18 }))).toBe(true);
    expect(matchesClause({ attribute: 'age', op: 'lte', values: [18] }, ctx({ age: 18 }))).toBe(true);
    expect(matchesClause({ attribute: 'age', op: 'gt', values: [18] }, ctx({ age: 18 }))).toBe(false);
  });
  it('numeric operators with string values', () => {
    expect(matchesClause({ attribute: 'age', op: 'gt', values: [18] }, ctx({ age: '25' }))).toBe(true);
  });
  it('semverEq', () => {
    expect(matchesClause({ attribute: 'version', op: 'semverEq', values: ['1.2.3'] }, ctx({ version: '1.2.3' }))).toBe(true);
    expect(matchesClause({ attribute: 'version', op: 'semverEq', values: ['1.2.4'] }, ctx({ version: '1.2.3' }))).toBe(false);
  });
  it('semverGt', () => {
    expect(matchesClause({ attribute: 'version', op: 'semverGt', values: ['1.2.3'] }, ctx({ version: '2.0.0' }))).toBe(true);
    expect(matchesClause({ attribute: 'version', op: 'semverGt', values: ['1.2.3'] }, ctx({ version: '1.2.3' }))).toBe(false);
  });
  it('semverLt', () => {
    expect(matchesClause({ attribute: 'version', op: 'semverLt', values: ['2.0.0'] }, ctx({ version: '1.2.3' }))).toBe(true);
  });
  it('negate inverts result', () => {
    expect(matchesClause({ attribute: 'country', op: 'eq', values: ['US'], negate: true }, ctx({ country: 'US' }))).toBe(false);
    expect(matchesClause({ attribute: 'country', op: 'eq', values: ['US'], negate: true }, ctx({ country: 'UK' }))).toBe(true);
  });
  it('missing attribute - does not match (except neq)', () => {
    expect(matchesClause({ attribute: 'missing', op: 'eq', values: ['x'] }, ctx({}))).toBe(false);
    expect(matchesClause({ attribute: 'missing', op: 'neq', values: ['x'] }, ctx({}))).toBe(true);
  });
  it('contextKind filtering', () => {
    expect(matchesClause({ attribute: 'key', op: 'eq', values: ['user1'], contextKind: 'user' }, ctx({}))).toBe(true);
    expect(matchesClause({ attribute: 'key', op: 'eq', values: ['user1'], contextKind: 'org' }, ctx({}))).toBe(false);
  });
});

describe('matchesRule', () => {
  it('AND logic - all clauses must match', () => {
    const rule: TargetingRule = {
      id: 'r1',
      clauses: [
        { attribute: 'country', op: 'eq', values: ['US'] },
        { attribute: 'age', op: 'gt', values: [18] },
      ],
    };
    expect(matchesRule(rule, ctx({ country: 'US', age: 25 }))).toBe(true);
    expect(matchesRule(rule, ctx({ country: 'US', age: 10 }))).toBe(false);
  });

  it('segment reference', () => {
    const rule: TargetingRule = { id: 'r1', clauses: [], ref: 'beta-users' };
    const segments = new Map<string, Segment>([
      ['beta-users', { key: 'beta-users', rules: [], included: ['user1'], excluded: [] }],
    ]);
    expect(matchesRule(rule, ctx({}), segments)).toBe(true);
  });
});
