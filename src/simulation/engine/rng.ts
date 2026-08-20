/**
 * Deterministic 32-bit Mulberry32 PRNG.
 * Pure functional interface: returns next value and advanced seed state.
 */

export interface RngStepResult<T> {
  value: T;
  nextState: number;
}

/**
 * Steps the PRNG and returns a uniform floating-point number in [0, 1).
 */
export function nextRandom(state: number): RngStepResult<number> {
  const nextState = ((state + 0x6d2b79f5) | 0);
  let t = nextState;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return { value, nextState };
}

/**
 * Returns a random integer in the range [min, max] inclusive.
 */
export function randomIntRange(
  state: number,
  min: number,
  max: number
): RngStepResult<number> {
  const { value, nextState } = nextRandom(state);
  const floorMin = Math.floor(min);
  const floorMax = Math.floor(max);
  const result = floorMin + Math.floor(value * (floorMax - floorMin + 1));
  return { value: Math.min(floorMax, Math.max(floorMin, result)), nextState };
}

/**
 * Returns a random float in the range [min, max].
 */
export function randomFloatRange(
  state: number,
  min: number,
  max: number
): RngStepResult<number> {
  const { value, nextState } = nextRandom(state);
  return { value: min + value * (max - min), nextState };
}

/**
 * Selects a random element from an array.
 */
export function randomChoice<T>(
  state: number,
  items: readonly T[]
): RngStepResult<T> {
  if (items.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  const { value: index, nextState } = randomIntRange(state, 0, items.length - 1);
  return { value: items[index], nextState };
}

/**
 * Selects an item from weighted candidates.
 */
export function weightedChoice<T>(
  state: number,
  candidates: readonly { item: T; weight: number }[]
): RngStepResult<T> {
  if (candidates.length === 0) {
    throw new Error('Cannot select from empty candidates');
  }

  let totalWeight = 0;
  for (const c of candidates) {
    totalWeight += Math.max(0, c.weight);
  }

  if (totalWeight <= 0) {
    return { value: candidates[0].item, nextState: state };
  }

  const { value: randVal, nextState } = nextRandom(state);
  const target = randVal * totalWeight;

  let cumulative = 0;
  for (const c of candidates) {
    cumulative += Math.max(0, c.weight);
    if (target <= cumulative) {
      return { value: c.item, nextState };
    }
  }

  return { value: candidates[candidates.length - 1].item, nextState };
}
