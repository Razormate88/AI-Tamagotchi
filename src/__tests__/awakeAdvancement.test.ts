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

describe('Awake Simulation Advancement', () => {
  it('advances needs deterministically over 1 hour of awake life', () => {
    const t0 = 1000000;
    const t1 = t0 + MS_PER_HOUR;
    const initial = createDefaultPetState('test-pet', t0);
    initial.satiety = 80;
    initial.energy = 85;
    initial.fun = 75;
    initial.social = 75;
    initial.sleepState = 'awake';

    const result = SimulationCore.step(initial, t1, lifeConfig, reactionPack);

    // Expected decay per hour: satiety: 5, energy: 4.5, fun: 5.5, social: 5.0
    expect(result.nextState.satiety).toBeCloseTo(75, 1);
    expect(result.nextState.energy).toBeCloseTo(80.5, 1);
    expect(result.nextState.fun).toBeCloseTo(69.5, 1);
    expect(result.nextState.social).toBeCloseTo(70, 1);
    expect(result.nextState.totalAwakeMs).toBe(MS_PER_HOUR);
    expect(result.nextState.totalAsleepMs).toBe(0);
    expect(result.nextState.simulationUpdatedAt).toBe(t1);
  });

  it('accumulates continuous wall-clock time across multiple micro-steps', () => {
    const t0 = 1000000;
    let state = createDefaultPetState('test-pet', t0);

    // Step 60 times by 1 minute each (60 seconds = 60,000 ms)
    for (let i = 1; i <= 60; i++) {
      const stepTime = t0 + i * 60000;
      const stepResult = SimulationCore.step(state, stepTime, lifeConfig, reactionPack);
      state = stepResult.nextState;
    }

    expect(state.totalAwakeMs).toBe(MS_PER_HOUR);
    expect(state.satiety).toBeCloseTo(75, 1);
  });
});
