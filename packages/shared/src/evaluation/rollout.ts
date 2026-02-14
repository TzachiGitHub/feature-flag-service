import { murmurHash3 } from '../hashing/murmurHash.js';
import type { Rollout, Context } from './types.js';

export function bucketContext(flagKey: string, rollout: Rollout, context: Context): string {
  const bucketBy = rollout.bucketBy || 'key';
  const bucketValue = bucketBy === 'key' ? context.key : (context.attributes[bucketBy] ?? context.key);
  const hashInput = `${flagKey}.${bucketValue}`;
  const hash = murmurHash3(hashInput);
  const bucket = hash % 100000;

  let cumulative = 0;
  for (const wv of rollout.variations) {
    cumulative += wv.weight;
    if (bucket < cumulative) {
      return wv.variationId;
    }
  }

  // Fallback to last variation
  return rollout.variations[rollout.variations.length - 1].variationId;
}
