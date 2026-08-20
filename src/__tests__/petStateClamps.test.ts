import { describe, it, expect } from 'vitest';
import { clampNeed } from '../simulation/time/timeUtils';
import { SimulationCore } from '../simulation/engine/simulationCore';
import { createDefaultPetState } from '../simulation/model/petState';
import lifeBlueprint from '../../brain/species/life.json';
import reactionsBlueprint from '../../brain/species/reactions.json';
import { SpeciesLifeConfig } from '../simulation/model/speciesLife';
import { SpeciesReactionPack } from '../simulation/model/reactions';

const lifeConfig = lifeBlueprint as SpeciesLifeConfig;
const reactionPack = reactionsBlueprint as SpeciesReactionPack;

describe('Need Clamping & Invariant Verification', () => {
  it('strictly clamps values within [0, 100]', () => {
    expect(clampNeed(-50)).toBe(0);
    expect(clampNeed(0)).toBe(0);
    expect(clampNeed(50)).toBe(50);
    expect(clampNeed(100)).toBe(100);
    expect(clampNeed(150)).toBe(100);
  });

  it('keeps all 4 needs strictly clamped to [0, 100] after extreme manual interactions', () => {
    const now = 1000000;
    let state = createDefaultPetState('test-pet', now);

    // Repeated feeds at 100 satiety
    state.satiety = 100;
    const feedResult = SimulationCore.interact(state, 'feed', now, lifeConfig, reactionPack);
    expect(feedResult.nextState.satiety).toBe(100);

    // Repeated plays at 0 energy
    state.energy = 5;
    const playResult = SimulationCore.interact(state, 'play', now, lifeConfig, reactionPack);
    expect(playResult.nextState.energy).toBeGreaterThanOrEqual(0);
    expect(playResult.nextState.energy).toBeLessThanOrEqual(100);
  });

  it('preserves clamped invariants during 365 days of unattended awake decay', () => {
    const start = 1000000;
    const oneYearLater = start + 365 * 24 * 3600 * 1000;
    const state = createDefaultPetState('test-pet', start);

    const result = SimulationCore.catchup(state, oneYearLater, lifeConfig, reactionPack);
    expect(result.nextState.satiety).toBe(0);
    expect(result.nextState.energy).toBe(0);
    expect(result.nextState.fun).toBe(0);
    expect(result.nextState.social).toBe(0);
    expect(result.nextState.satiety).toBeGreaterThanOrEqual(0);
    expect(result.nextState.energy).toBeGreaterThanOrEqual(0);
  });
});
