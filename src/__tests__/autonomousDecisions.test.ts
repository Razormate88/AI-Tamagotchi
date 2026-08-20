import { describe, it, expect } from 'vitest';
import { evaluateAutonomousDecision } from '../simulation/behavior/autonomousEngine';
import { createDefaultPetState, PetActivityType } from '../simulation/model/petState';
import lifeBlueprint from '../../brain/species/life.json';
import reactionsBlueprint from '../../brain/species/reactions.json';
import { SpeciesLifeConfig } from '../simulation/model/speciesLife';
import { SpeciesReactionPack } from '../simulation/model/reactions';

const lifeConfig = lifeBlueprint as SpeciesLifeConfig;
const reactionPack = reactionsBlueprint as SpeciesReactionPack;

describe('Autonomous Decision Engine', () => {
  it('disallows self_play when Gloop is exhausted (energy < 20)', () => {
    const now = 1000000;
    const state = createDefaultPetState('test-pet', now);
    state.energy = 10;
    state.fun = 10; // Low fun would normally boost self_play, but exhaustion blocks it

    // Evaluate 50 decisions across different seeds
    for (let seed = 1; seed <= 50; seed++) {
      state.rngState = seed;
      const decision = evaluateAutonomousDecision(
        state,
        now,
        lifeConfig,
        reactionPack,
        ['curious', 'bouncy']
      );
      expect(decision.nextState.currentActivity).not.toBe('self_play');
    }
  });

  it('strongly biases nap/sleep and yawn when energy is critical', () => {
    const now = 1000000;
    const state = createDefaultPetState('test-pet', now);
    state.energy = 8; // critically low

    const activities: PetActivityType[] = [];
    for (let seed = 100; seed < 150; seed++) {
      state.rngState = seed;
      const decision = evaluateAutonomousDecision(
        state,
        now,
        lifeConfig,
        reactionPack
      );
      activities.push(decision.nextState.currentActivity);
    }

    const sleepyBehaviors = activities.filter(
      (a) => a === 'nap' || a === 'yawn' || a === 'sleep' || a === 'idle'
    );
    expect(sleepyBehaviors.length).toBeGreaterThan(35);
  });

  it('biases complain_hungry and emits hunger speech when satiety is low', () => {
    const now = 1000000;
    const state = createDefaultPetState('test-pet', now);
    state.satiety = 10; // critically low
    state.lastSpeechAt = 0; // cooldown elapsed

    const activities: PetActivityType[] = [];
    let hungerSpeechCount = 0;

    for (let seed = 200; seed < 250; seed++) {
      state.rngState = seed;
      const decision = evaluateAutonomousDecision(
        state,
        now,
        lifeConfig,
        reactionPack
      );
      activities.push(decision.nextState.currentActivity);
      if (decision.speechBubble?.category === 'needs.hungry') {
        hungerSpeechCount++;
      }
    }

    expect(activities.includes('complain_hungry')).toBe(true);
    expect(hungerSpeechCount).toBeGreaterThan(0);
  });

  it('biases seek_attention when social is low', () => {
    const now = 1000000;
    const state = createDefaultPetState('test-pet', now);
    state.social = 15;

    const activities: PetActivityType[] = [];
    for (let seed = 300; seed < 350; seed++) {
      state.rngState = seed;
      const decision = evaluateAutonomousDecision(
        state,
        now,
        lifeConfig,
        reactionPack,
        ['affectionate']
      );
      activities.push(decision.nextState.currentActivity);
    }

    const socialActivities = activities.filter(
      (a) => a === 'seek_attention' || a === 'complain_lonely'
    );
    expect(socialActivities.length).toBeGreaterThan(15);
  });
});
