import { describe, it, expect } from 'vitest';
import { createDefaultPetState } from '../simulation/model/petState';

describe('Migration & First-Run State Initialization', () => {
  it('creates comfortable first-life seed values without needy extremes', () => {
    const now = 1700000000000;
    const seedState = createDefaultPetState('default-pet', now, 42);

    expect(seedState.petId).toBe('default-pet');
    // Needs should be comfortable (65-85 range)
    expect(seedState.satiety).toBeGreaterThanOrEqual(65);
    expect(seedState.satiety).toBeLessThanOrEqual(85);
    expect(seedState.energy).toBeGreaterThanOrEqual(65);
    expect(seedState.energy).toBeLessThanOrEqual(85);
    expect(seedState.fun).toBeGreaterThanOrEqual(65);
    expect(seedState.fun).toBeLessThanOrEqual(85);
    expect(seedState.social).toBeGreaterThanOrEqual(65);
    expect(seedState.social).toBeLessThanOrEqual(85);

    expect(seedState.sleepState).toBe('awake');
    expect(seedState.currentActivity).toBe('idle');
    expect(seedState.totalAwakeMs).toBe(0);
    expect(seedState.totalAsleepMs).toBe(0);
    expect(seedState.revision).toBe(1);
    expect(seedState.rngState).toBe(42);
  });
});
