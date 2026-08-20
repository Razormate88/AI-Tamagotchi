import { describe, it, expect } from 'vitest';
import { deriveMood } from '../simulation/mood/moodEngine';
import { createDefaultPetState } from '../simulation/model/petState';
import lifeBlueprint from '../../brain/species/life.json';
import { SpeciesLifeConfig } from '../simulation/model/speciesLife';

const lifeConfig = lifeBlueprint as SpeciesLifeConfig;

describe('Derived Mood Engine', () => {
  const now = 1000000;

  it('asleep overrides all other needs conditions', () => {
    const state = createDefaultPetState('test-pet', now);
    state.sleepState = 'asleep';
    state.satiety = 10;
    state.fun = 10;
    expect(deriveMood(state, now, lifeConfig)).toBe('asleep');
  });

  it('derives grumpy when multiple needs are severely low', () => {
    const state = createDefaultPetState('test-pet', now);
    state.satiety = 20;
    state.fun = 20;
    state.social = 80;
    state.energy = 80;
    expect(deriveMood(state, now, lifeConfig)).toBe('grumpy');
  });

  it('derives tired, hungry, lonely, bored based on isolated low needs', () => {
    const base = createDefaultPetState('test-pet', now);

    // Tired
    const tiredState = { ...base, energy: 20 };
    expect(deriveMood(tiredState, now, lifeConfig)).toBe('tired');

    // Hungry
    const hungryState = { ...base, satiety: 20 };
    expect(deriveMood(hungryState, now, lifeConfig)).toBe('hungry');

    // Lonely
    const lonelyState = { ...base, social: 20 };
    expect(deriveMood(lonelyState, now, lifeConfig)).toBe('lonely');

    // Bored
    const boredState = { ...base, fun: 20 };
    expect(deriveMood(boredState, now, lifeConfig)).toBe('bored');
  });

  it('derives excited when all needs are high and recent interaction occurred', () => {
    const state = createDefaultPetState('test-pet', now);
    state.satiety = 90;
    state.energy = 90;
    state.fun = 90;
    state.social = 90;
    state.lastInteractionAt = now - 30000; // 30 seconds ago
    expect(deriveMood(state, now, lifeConfig)).toBe('excited');
  });

  it('derives happy for high wellbeing or content for baseline', () => {
    const happyState = createDefaultPetState('test-pet', now);
    happyState.satiety = 80;
    happyState.energy = 80;
    happyState.fun = 75;
    happyState.social = 75;
    happyState.lastInteractionAt = now - 600000; // 10 minutes ago
    expect(deriveMood(happyState, now, lifeConfig)).toBe('happy');

    const contentState = createDefaultPetState('test-pet', now);
    contentState.satiety = 60;
    contentState.energy = 60;
    contentState.fun = 60;
    contentState.social = 60;
    contentState.lastInteractionAt = now - 600000; // 10 minutes ago
    expect(deriveMood(contentState, now, lifeConfig)).toBe('content');
  });
});
