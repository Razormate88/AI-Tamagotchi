import { PetLifeEvent, PetSleepState, PetState } from '../model/petState';
import { SpeciesLifeConfig } from '../model/speciesLife';
import { SpeciesReactionPack } from '../model/reactions';
import { randomChoice } from './rng';
import { clampNeed } from '../time/timeUtils';

export interface InteractionResult {
  nextState: PetState;
  lifeEvents: PetLifeEvent[];
  speechBubble?: {
    text: string;
    category?: string;
    priority: 'low' | 'normal' | 'urgent';
  };
  squishImpulse?: number;
}

export type InteractionType = 'feed' | 'pet' | 'play' | 'poke' | 'sleep' | 'wake';

/**
 * Executes a manual care or status interaction authoritatively against Gloop's simulation state.
 */
export function applyInteraction(
  state: PetState,
  type: InteractionType,
  now: number,
  config: SpeciesLifeConfig,
  reactions: SpeciesReactionPack,
  recentPokeCount: number = 0
): InteractionResult {
  let rng = state.rngState;
  const lifeEvents: PetLifeEvent[] = [];
  let speechCategory: string = 'interaction.pet';
  let speechPriority: 'low' | 'normal' | 'urgent' = 'normal';
  let squishImpulse = 0;

  let nextSatiety = state.satiety;
  let nextEnergy = state.energy;
  let nextFun = state.fun;
  let nextSocial = state.social;
  let nextSleepState: PetSleepState = state.sleepState;
  let nextActivity = state.currentActivity;
  let nextActivityDuration = state.activityDurationMs;

  switch (type) {
    case 'feed': {
      const feedCfg = config.interactionEffects.feed;
      if (state.satiety >= feedCfg.fullThreshold) {
        // Blob is too full to eat
        speechCategory = 'interaction.feed_full';
      } else {
        nextSatiety = clampNeed(state.satiety + feedCfg.satietyDelta);
        nextFun = clampNeed(state.fun + feedCfg.funDelta);
        nextSocial = clampNeed(state.social + feedCfg.socialDelta);
        speechCategory = 'interaction.feed';
        squishImpulse = 4.0;
        nextActivity = 'bounce';
        nextActivityDuration = 4000;
      }

      lifeEvents.push({
        petId: state.petId,
        eventType: 'interaction.feed',
        occurredAt: now,
        importance: 0.3,
        payloadJson: JSON.stringify({ satiety: nextSatiety }),
      });
      break;
    }

    case 'pet': {
      const petCfg = config.interactionEffects.pet;
      const timeSinceLast = now - state.lastInteractionAt;
      const isSpam = timeSinceLast < petCfg.cooldownMs;

      const socialGain = isSpam ? Math.floor(petCfg.socialDelta * 0.4) : petCfg.socialDelta;
      const funGain = isSpam ? Math.floor(petCfg.funDelta * 0.4) : petCfg.funDelta;

      nextSocial = clampNeed(state.social + socialGain);
      nextFun = clampNeed(state.fun + funGain);
      speechCategory = 'interaction.pet';
      squishImpulse = 3.0;

      lifeEvents.push({
        petId: state.petId,
        eventType: 'interaction.pet',
        occurredAt: now,
        importance: 0.25,
        payloadJson: JSON.stringify({ social: nextSocial }),
      });
      break;
    }

    case 'play': {
      const playCfg = config.interactionEffects.play;
      if (state.energy < playCfg.minEnergyRequired) {
        // Refusal if exhausted
        speechCategory = 'interaction.play_tired';
      } else {
        nextFun = clampNeed(state.fun + playCfg.funDelta);
        nextSocial = clampNeed(state.social + playCfg.socialDelta);
        nextEnergy = clampNeed(state.energy + playCfg.energyDelta);
        nextSatiety = clampNeed(state.satiety + playCfg.satietyDelta);
        speechCategory = 'interaction.play';
        squishImpulse = 7.0;
        nextActivity = 'celebrate';
        nextActivityDuration = 5000;
      }

      lifeEvents.push({
        petId: state.petId,
        eventType: 'interaction.play',
        occurredAt: now,
        importance: 0.35,
        payloadJson: JSON.stringify({ fun: nextFun, energy: nextEnergy }),
      });
      break;
    }

    case 'poke': {
      const pokeCfg = config.interactionEffects.poke;
      squishImpulse = -8.5; // Squash impulse

      if (recentPokeCount >= pokeCfg.repeatedPokeCountAnnoy) {
        speechCategory = 'interaction.poke_repeated';
        speechPriority = 'urgent';
        nextFun = clampNeed(state.fun - 2);
        nextActivity = 'sulk';
        nextActivityDuration = 3000;
      } else {
        speechCategory = 'interaction.poke';
        nextFun = clampNeed(state.fun + pokeCfg.funDelta);
      }

      lifeEvents.push({
        petId: state.petId,
        eventType: 'interaction.poke',
        occurredAt: now,
        importance: recentPokeCount >= 3 ? 0.4 : 0.15,
        payloadJson: JSON.stringify({ pokeCount: recentPokeCount + 1 }),
      });
      break;
    }

    case 'sleep': {
      if (state.sleepState === 'asleep') {
        speechCategory = 'interaction.sleep';
      } else {
        nextSleepState = 'asleep';
        nextActivity = 'sleep';
        nextActivityDuration = config.sleepParameters.minSleepDurationMs;
        speechCategory = 'interaction.sleep';

        lifeEvents.push({
          petId: state.petId,
          eventType: 'sleep.started',
          occurredAt: now,
          importance: 0.4,
          payloadJson: JSON.stringify({ source: 'manual_request' }),
        });
      }
      break;
    }

    case 'wake': {
      if (state.sleepState === 'awake') {
        speechCategory = 'interaction.wake';
      } else {
        nextSleepState = 'awake';
        nextActivity = 'wake';
        nextActivityDuration = 5000;
        speechCategory = 'interaction.wake';

        lifeEvents.push({
          petId: state.petId,
          eventType: 'sleep.woke',
          occurredAt: now,
          importance: 0.4,
          payloadJson: JSON.stringify({
            source: 'manual_request',
            energy: state.energy,
          }),
        });
      }
      break;
    }
  }

  // Select speech line from reaction pack
  let speechBubble: { text: string; category?: string; priority: 'low' | 'normal' | 'urgent' } | undefined;
  const pool = reactions.pools[speechCategory];
  if (pool && pool.length > 0) {
    const textChoice = randomChoice(rng, pool);
    rng = textChoice.nextState;
    speechBubble = {
      text: textChoice.value,
      category: speechCategory,
      priority: speechPriority,
    };
  }

  const nextState: PetState = {
    ...state,
    satiety: nextSatiety,
    energy: nextEnergy,
    fun: nextFun,
    social: nextSocial,
    sleepState: nextSleepState,
    currentActivity: nextActivity,
    activityStartedAt: now,
    activityDurationMs: nextActivityDuration,
    simulationUpdatedAt: now,
    lastInteractionAt: now,
    lastSpeechAt: speechBubble ? now : state.lastSpeechAt,
    rngState: rng,
    revision: state.revision + 1,
  };

  return {
    nextState,
    lifeEvents,
    speechBubble,
    squishImpulse,
  };
}
