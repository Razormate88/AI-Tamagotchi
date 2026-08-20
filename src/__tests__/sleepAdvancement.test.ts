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

describe('Sleep Simulation & Energy Recovery', () => {
  it('recovers energy and slows decay rates during sleep', () => {
    const t0 = 1000000;
    const t1 = t0 + MS_PER_HOUR * 2; // 2 hours of sleep
    const state = createDefaultPetState('test-pet', t0);
    state.satiety = 60;
    state.energy = 20; // tired
    state.fun = 50;
    state.social = 50;
    state.sleepState = 'asleep';
    state.currentActivity = 'sleep';

    const result = SimulationCore.step(state, t1, lifeConfig, reactionPack);

    // Expected recovery: +12.5 * 2 = +25 energy (20 -> 45)
    // Satiety decay: -2.0 * 2 = -4 (60 -> 56)
    // Fun decay: -1.5 * 2 = -3 (50 -> 47)
    // Social decay: -1.5 * 2 = -3 (50 -> 47)
    expect(result.nextState.energy).toBeCloseTo(45, 1);
    expect(result.nextState.satiety).toBeCloseTo(56, 1);
    expect(result.nextState.fun).toBeCloseTo(47, 1);
    expect(result.nextState.social).toBeCloseTo(47, 1);
    expect(result.nextState.totalAsleepMs).toBe(MS_PER_HOUR * 2);
    expect(result.nextState.totalAwakeMs).toBe(0);
    expect(result.mood).toBe('asleep');
  });

  it('wakes up autonomously when rested threshold is exceeded after sleep', () => {
    const t0 = 1000000;
    const state = createDefaultPetState('test-pet', t0);
    state.energy = 90; // Rested above 85
    state.sleepState = 'asleep';
    state.currentActivity = 'sleep';
    state.activityStartedAt = t0 - 20000;
    state.activityDurationMs = 15000; // activity expired

    const result = SimulationCore.step(state, t0, lifeConfig, reactionPack);
    expect(result.nextState.sleepState).toBe('awake');
    expect(result.nextState.currentActivity).toBe('wake');
    expect(result.lifeEvents.some((e) => e.eventType === 'sleep.woke')).toBe(true);
  });
});
