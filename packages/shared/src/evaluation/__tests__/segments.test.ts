import { describe, it, expect } from 'vitest';
import { isInSegment } from '../segments.js';
import type { Segment, Context } from '../types.js';

const ctx = (key: string = 'user1', attrs: Record<string, any> = {}): Context => ({
  kind: 'user', key, attributes: attrs,
});

describe('isInSegment', () => {
  it('excluded context → not in segment', () => {
    const seg: Segment = { key: 's1', rules: [], included: ['user1'], excluded: ['user1'] };
    expect(isInSegment(seg, ctx('user1'))).toBe(false);
  });

  it('included context → in segment', () => {
    const seg: Segment = { key: 's1', rules: [], included: ['user1'], excluded: [] };
    expect(isInSegment(seg, ctx('user1'))).toBe(true);
  });

  it('rule match → in segment', () => {
    const seg: Segment = {
      key: 's1',
      rules: [{ id: 'r1', clauses: [{ attribute: 'country', op: 'eq', values: ['US'] }] }],
      included: [],
      excluded: [],
    };
    expect(isInSegment(seg, ctx('user1', { country: 'US' }))).toBe(true);
  });

  it('no match → not in segment', () => {
    const seg: Segment = { key: 's1', rules: [], included: [], excluded: [] };
    expect(isInSegment(seg, ctx('user1'))).toBe(false);
  });

  it('excluded overrides included', () => {
    const seg: Segment = { key: 's1', rules: [], included: ['user1'], excluded: ['user1'] };
    expect(isInSegment(seg, ctx('user1'))).toBe(false);
  });
});
