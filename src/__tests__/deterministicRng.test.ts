import { describe, it, expect } from 'vitest';
import {
  nextRandom,
  randomChoice,
  randomIntRange,
  weightedChoice,
} from '../simulation/engine/rng';

describe('Deterministic 32-bit PRNG', () => {
  it('generates identical sequence of numbers given the same initial seed', () => {
    const seed = 12345;

    let s1 = seed;
    let s2 = seed;

    for (let i = 0; i < 20; i++) {
      const r1 = nextRandom(s1);
      const r2 = nextRandom(s2);

      expect(r1.value).toBe(r2.value);
      expect(r1.nextState).toBe(r2.nextState);
      expect(r1.value).toBeGreaterThanOrEqual(0);
      expect(r1.value).toBeLessThan(1);

      s1 = r1.nextState;
      s2 = r2.nextState;
    }
  });

  it('produces deterministic integer ranges and random choices', () => {
    const seed = 99999;

    const r1 = randomIntRange(seed, 10, 50);
    const r2 = randomIntRange(seed, 10, 50);

    expect(r1.value).toBe(r2.value);
    expect(r1.value).toBeGreaterThanOrEqual(10);
    expect(r1.value).toBeLessThanOrEqual(50);

    const items = ['apple', 'banana', 'cherry', 'date'];
    const c1 = randomChoice(seed, items);
    const c2 = randomChoice(seed, items);
    expect(c1.value).toBe(c2.value);
  });

  it('respects weighted choice distributions deterministically', () => {
    const seed = 42;
    const candidates = [
      { item: 'rare', weight: 1 },
      { item: 'common', weight: 99 },
    ];

    let currentSeed = seed;
    let commonCount = 0;

    for (let i = 0; i < 100; i++) {
      const res = weightedChoice(currentSeed, candidates);
      if (res.value === 'common') commonCount++;
      currentSeed = res.nextState;
    }

    expect(commonCount).toBeGreaterThan(85);
  });
});
