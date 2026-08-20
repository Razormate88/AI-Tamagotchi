import { describe, it, expect } from 'vitest';
import { SimulationCore } from '../simulation/engine/simulationCore';
import { createDefaultPetState } from '../simulation/model/petState';
import lifeBlueprint from '../../brain/species/life.json';
import reactionsBlueprint from '../../brain/species/reactions.json';
import { SpeciesLifeConfig } from '../simulation/model/speciesLife';
import { SpeciesReactionPack } from '../simulation/model/reactions';

const lifeConfig = lifeBlueprint as SpeciesLifeConfig;
const reactionPack = reactionsBlueprint as SpeciesReactionPack;

describe('Manual Care & Status Interactions', () => {
  const now = 1000000;

  it('Feed increases satiety and clamps to 100', () => {
    const state = createDefaultPetState('test-pet', now);
    state.satiety = 60;

    const result = SimulationCore.interact(state, 'feed', now, lifeConfig, reactionPack);
    expect(result.nextState.satiety).toBe(85); // 60 + 25
    expect(result.speechBubble?.category).toBe('interaction.feed');
    expect(result.lifeEvents.some((e) => e.eventType === 'interaction.feed')).toBe(true);
  });

  it('Feed refuses politely when Gloop is already full (> 92)', () => {
    const state = createDefaultPetState('test-pet', now);
    state.satiety = 95;

    const result = SimulationCore.interact(state, 'feed', now, lifeConfig, reactionPack);
    expect(result.nextState.satiety).toBe(95); // unchanged
    expect(result.speechBubble?.category).toBe('interaction.feed_full');
  });

  it('Pet increases social and fun and applies soft diminishing returns on spam', () => {
    const state = createDefaultPetState('test-pet', now);
    state.social = 50;
    state.fun = 50;
    state.lastInteractionAt = now - 10000; // 10s ago, outside 4s cooldown

    const result = SimulationCore.interact(state, 'pet', now, lifeConfig, reactionPack);
    expect(result.nextState.social).toBe(68); // 50 + 18
    expect(result.nextState.fun).toBe(55); // 50 + 5
    expect(result.speechBubble?.category).toBe('interaction.pet');

    // Immediate repeat pet (spam within 1s) has diminished benefits
    const spamResult = SimulationCore.interact(result.nextState, 'pet', now + 1000, lifeConfig, reactionPack);
    expect(spamResult.nextState.social).toBe(68 + 7); // 68 + Math.floor(18 * 0.4)
    expect(spamResult.nextState.fun).toBe(55 + 2); // 55 + Math.floor(5 * 0.4)
  });

  it('Play increases fun & social while consuming energy and satiety', () => {
    const state = createDefaultPetState('test-pet', now);
    state.fun = 40;
    state.social = 40;
    state.energy = 80;
    state.satiety = 80;

    const result = SimulationCore.interact(state, 'play', now, lifeConfig, reactionPack);
    expect(result.nextState.fun).toBe(68); // 40 + 28
    expect(result.nextState.social).toBe(50); // 40 + 10
    expect(result.nextState.energy).toBe(68); // 80 - 12
    expect(result.nextState.satiety).toBe(74); // 80 - 6
    expect(result.speechBubble?.category).toBe('interaction.play');
  });

  it('Play refuses when Gloop is too exhausted (energy < 18)', () => {
    const state = createDefaultPetState('test-pet', now);
    state.energy = 10;

    const result = SimulationCore.interact(state, 'play', now, lifeConfig, reactionPack);
    expect(result.nextState.energy).toBe(10); // unchanged
    expect(result.speechBubble?.category).toBe('interaction.play_tired');
  });

  it('Poke triggers visual reaction and repeated poke annoyance', () => {
    const state = createDefaultPetState('test-pet', now);

    // Normal poke
    const normalPoke = SimulationCore.interact(state, 'poke', now, lifeConfig, reactionPack, 0);
    expect(normalPoke.speechBubble?.category).toBe('interaction.poke');
    expect(normalPoke.squishImpulse).toBeLessThan(0);

    // Repeated poke (count >= 3)
    const repeatedPoke = SimulationCore.interact(state, 'poke', now, lifeConfig, reactionPack, 3);
    expect(repeatedPoke.speechBubble?.category).toBe('interaction.poke_repeated');
    expect(repeatedPoke.speechBubble?.priority).toBe('urgent');
  });

  it('Sleep and Wake toggle states authoritatively', () => {
    const state = createDefaultPetState('test-pet', now);
    state.sleepState = 'awake';

    const sleepResult = SimulationCore.interact(state, 'sleep', now, lifeConfig, reactionPack);
    expect(sleepResult.nextState.sleepState).toBe('asleep');
    expect(sleepResult.speechBubble?.category).toBe('interaction.sleep');
    expect(sleepResult.lifeEvents.some((e) => e.eventType === 'sleep.started')).toBe(true);

    const wakeResult = SimulationCore.interact(sleepResult.nextState, 'wake', now + 1000, lifeConfig, reactionPack);
    expect(wakeResult.nextState.sleepState).toBe('awake');
    expect(wakeResult.speechBubble?.category).toBe('interaction.wake');
    expect(wakeResult.lifeEvents.some((e) => e.eventType === 'sleep.woke')).toBe(true);
  });
});
