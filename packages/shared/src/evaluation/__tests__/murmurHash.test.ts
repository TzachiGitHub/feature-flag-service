import { describe, it, expect } from 'vitest';
import { murmurHash3 } from '../../hashing/murmurHash.js';

describe('murmurHash3', () => {
  it('is deterministic', () => {
    expect(murmurHash3('hello')).toBe(murmurHash3('hello'));
  });
  it('returns unsigned 32-bit int', () => {
    const h = murmurHash3('test');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xFFFFFFFF);
  });
  it('different inputs produce different outputs', () => {
    expect(murmurHash3('a')).not.toBe(murmurHash3('b'));
  });
  it('seed changes output', () => {
    expect(murmurHash3('test', 0)).not.toBe(murmurHash3('test', 42));
  });
});
