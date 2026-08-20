import { describe, it, expect } from 'vitest';
import { SimulationCore } from '../simulation/engine/simulationCore';
import { createDefaultPetState } from '../simulation/model/petState';
import lifeBlueprint from '../../brain/species/life.json';
import reactionsBlueprint from '../../brain/species/reactions.json';
import { SpeciesLifeConfig } from '../simulation/model/speciesLife';
import { SpeciesReactionPack } from '../simulation/model/reactions';
import { MS_PER_HOUR } from '../simulation/time/timeUtils';

const lifeConfig = lifeBlueprint as SpeciesLifeConfig;
const reactionPack = reactionsBlueprint as SpeciesReactionPack;

describe('Offline Simulation & Fast Catch-up', () => {
  it('executes 30-day offline catch-up instantaneously without unbounded loops', () => {
    const t0 = 1000000;
    const thirtyDaysMs = 30 * 24 * MS_PER_HOUR;
    const t1 = t0 + thirtyDaysMs;

    const state = createDefaultPetState('test-pet', t0);

    const startTime = performance.now();
    const result = SimulationCore.catchup(state, t1, lifeConfig, reactionPack);
    const durationMs = performance.now() - startTime;

    // Must execute instantaneously in O(1)
    expect(durationMs).toBeLessThan(50);
    expect(result.nextState.simulationUpdatedAt).toBe(t1);
    expect(result.nextState.satiety).toBe(0);
    expect(result.nextState.energy).toBe(0);
    expect(result.nextState.fun).toBe(0);
    expect(result.nextState.social).toBe(0);
    expect(result.returnReaction?.category).toBe('return.very_long');
    expect(result.returnReaction?.text).toBeDefined();
    expect(result.lifeEvents.some((e) => e.eventType === 'simulation.offline_catchup')).toBe(true);
    expect(result.lifeEvents.some((e) => e.eventType === 'owner.returned')).toBe(true);
  });

  it('selects appropriate return reaction bands across absence durations', () => {
    const t0 = 1000000;
    const baseState = createDefaultPetState('test-pet', t0);

    // 1. Medium absence (e.g. 1 hour = 60 mins > 15m shortMs)
    const mediumResult = SimulationCore.catchup(baseState, t0 + MS_PER_HOUR, lifeConfig, reactionPack);
    expect(mediumResult.returnReaction?.category).toBe('return.medium');

    // 2. Long absence (e.g. 8 hours > 3h mediumMs)
    const longResult = SimulationCore.catchup(baseState, t0 + 8 * MS_PER_HOUR, lifeConfig, reactionPack);
    expect(longResult.returnReaction?.category).toBe('return.long');

    // 3. Very long absence (e.g. 48 hours > 24h longMs)
    const veryLongResult = SimulationCore.catchup(baseState, t0 + 48 * MS_PER_HOUR, lifeConfig, reactionPack);
    expect(veryLongResult.returnReaction?.category).toBe('return.very_long');
  });

  it('handles offline sleeping progression and wake transition correctly', () => {
    const t0 = 1000000;
    const state = createDefaultPetState('test-pet', t0);
    state.sleepState = 'asleep';
    state.energy = 10;

    // 8 hours absence: Gloop sleeps until rested (~7.2 hours), then wakes up for the remainder
    const result = SimulationCore.catchup(state, t0 + 8 * MS_PER_HOUR, lifeConfig, reactionPack);
    expect(result.nextState.sleepState).toBe('awake');
    expect(result.nextState.energy).toBeGreaterThan(80);
    expect(result.nextState.totalAsleepMs).toBeGreaterThan(0);
  });
});
