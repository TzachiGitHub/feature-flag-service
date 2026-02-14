import { describe, it, expect } from 'vitest';
import { bucketContext } from '../rollout.js';
import type { Rollout, Context } from '../types.js';

const makeCtx = (key: string, attrs: Record<string, any> = {}): Context => ({
  kind: 'user', key, attributes: attrs,
});

describe('bucketContext', () => {
  const rollout5050: Rollout = {
    variations: [
      { variationId: 'v1', weight: 50000 },
      { variationId: 'v2', weight: 50000 },
    ],
  };

  it('deterministic - same input same output', () => {
    const r1 = bucketContext('flag1', rollout5050, makeCtx('user-abc'));
    const r2 = bucketContext('flag1', rollout5050, makeCtx('user-abc'));
    expect(r1).toBe(r2);
  });

  it('100% to one variation', () => {
    const rollout: Rollout = { variations: [{ variationId: 'v1', weight: 100000 }] };
    for (let i = 0; i < 100; i++) {
      expect(bucketContext('flag1', rollout, makeCtx(`user-${i}`))).toBe('v1');
    }
  });

  it('bucketBy custom attribute', () => {
    const rollout: Rollout = {
      variations: [{ variationId: 'v1', weight: 50000 }, { variationId: 'v2', weight: 50000 }],
      bucketBy: 'orgId',
    };
    const r1 = bucketContext('flag1', rollout, makeCtx('user1', { orgId: 'org-abc' }));
    const r2 = bucketContext('flag1', rollout, makeCtx('user2', { orgId: 'org-abc' }));
    // Same orgId → same bucket
    expect(r1).toBe(r2);
  });

  it('50/50 split is approximately 50% each over 100k users', () => {
    const counts: Record<string, number> = { v1: 0, v2: 0 };
    for (let i = 0; i < 100000; i++) {
      const result = bucketContext('test-flag', rollout5050, makeCtx(`user-${i}`));
      counts[result]++;
    }
    // Within 1% = 1000
    expect(Math.abs(counts.v1 - 50000)).toBeLessThan(1000);
    expect(Math.abs(counts.v2 - 50000)).toBeLessThan(1000);
  });

  it('different users get different buckets', () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(bucketContext('flag1', rollout5050, makeCtx(`user-${i}`)));
    }
    // With 20 users on a 50/50, we should see both variations
    expect(results.size).toBe(2);
  });
});
