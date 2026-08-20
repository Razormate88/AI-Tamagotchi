import { PetActivityType, PetLifeEvent, PetSleepState, PetState } from '../model/petState';
import { SpeciesLifeConfig } from '../model/speciesLife';
import { SpeciesReactionPack } from '../model/reactions';
import { randomChoice, randomIntRange, weightedChoice } from '../engine/rng';
import { clampNeed } from '../time/timeUtils';

export interface AutonomousDecisionResult {
  nextState: PetState;
  speechBubble?: {
    text: string;
    category?: string;
    priority: 'low' | 'normal' | 'urgent';
  };
  lifeEvents: PetLifeEvent[];
}

/**
 * Evaluates the next autonomous behavior for Gloop using utility scoring and temperament biases.
 */
export function evaluateAutonomousDecision(
  state: PetState,
  now: number,
  config: SpeciesLifeConfig,
  reactions: SpeciesReactionPack,
  temperamentTags: readonly string[] = []
): AutonomousDecisionResult {
  let rng = state.rngState;
  const lifeEvents: PetLifeEvent[] = [];

  // If pet is asleep: check if rested enough to wake autonomously
  if (state.sleepState === 'asleep') {
    if (state.energy >= config.sleepParameters.restedEnergyThreshold) {
      // Pet is fully rested and wakes up
      const { value: wakeDuration, nextState: rngAfterWake } = randomIntRange(
        rng,
        4000,
        8000
      );

      const nextState: PetState = {
        ...state,
        sleepState: 'awake',
        currentActivity: 'wake',
        activityStartedAt: now,
        activityDurationMs: wakeDuration,
        simulationUpdatedAt: now,
        rngState: rngAfterWake,
        revision: state.revision + 1,
      };

      lifeEvents.push({
        petId: state.petId,
        eventType: 'sleep.woke',
        occurredAt: now,
        importance: 0.3,
        payloadJson: JSON.stringify({ reason: 'rested_autonomous' }),
      });

      return {
        nextState,
        lifeEvents,
      };
    }

    // Continue sleeping
    return {
      nextState: {
        ...state,
        currentActivity: 'sleep',
        activityStartedAt: now,
        activityDurationMs: 15000,
        simulationUpdatedAt: now,
      },
      lifeEvents: [],
    };
  }

  // Candidate activities for awake state
  const candidates: { item: PetActivityType; weight: number }[] = [];
  const baseWeights = config.activityWeights;
  const low = config.thresholds.low;
  const critical = config.thresholds.criticalLow;

  const activityList: PetActivityType[] = [
    'idle',
    'look_around',
    'stretch',
    'bounce',
    'hum',
    'daydream',
    'self_play',
    'inspect_something',
    'seek_attention',
    'complain_hungry',
    'complain_bored',
    'complain_lonely',
    'yawn',
    'nap',
    'celebrate',
    'sulk',
  ];

  for (const act of activityList) {
    let weight = baseWeights[act] ?? 10;

    // Apply species temperament modifiers
    for (const tag of temperamentTags) {
      const tagMods = config.temperamentModifiers[tag];
      if (tagMods && tagMods[act] !== undefined) {
        weight *= tagMods[act]!;
      }
    }

    // State & need utility modulations
    if (state.energy <= low) {
      if (act === 'look_around' || act === 'stretch' || act === 'hum' || act === 'daydream' || act === 'inspect_something') {
        weight *= (state.energy <= critical ? 0.2 : 0.5);
      }
      if (act === 'idle') {
        weight *= 1.8;
      }
    }

    if (act === 'self_play') {
      if (state.energy < 20) {
        weight = 0; // Exhausted blob cannot play
      } else if (state.fun < low) {
        weight *= 2.5;
      }
    }

    if (act === 'bounce') {
      if (state.energy < 25) {
        weight = 0; // No bouncing when tired
      }
    }

    if (act === 'yawn') {
      if (state.energy <= critical) {
        weight *= 4.0;
      } else if (state.energy <= low) {
        weight *= 2.5;
      }
    }

    if (act === 'nap') {
      if (state.energy <= critical) {
        weight *= 8.0;
      } else if (state.energy <= config.sleepParameters.tiredEnergyThreshold) {
        weight *= 4.0;
      } else {
        weight = 0.5; // rare daytime catnap when not tired
      }
    }

    if (act === 'complain_hungry') {
      if (state.satiety <= critical) {
        weight *= 5.0;
      } else if (state.satiety <= low) {
        weight *= 2.5;
      } else {
        weight = 0; // No hunger complaints when satisfied
      }
    }

    if (act === 'complain_bored') {
      if (state.fun <= critical) {
        weight *= 4.0;
      } else if (state.fun <= low) {
        weight *= 2.0;
      } else {
        weight = 0;
      }
    }

    if (act === 'complain_lonely') {
      if (state.social <= critical) {
        weight *= 4.0;
      } else if (state.social <= low) {
        weight *= 2.0;
      } else {
        weight = 0;
      }
    }

    if (act === 'seek_attention') {
      if (state.social <= low) {
        weight *= 3.0;
      }
    }

    if (act === 'sulk') {
      if (state.fun <= low && state.satiety <= low) {
        weight *= 3.0;
      } else {
        weight *= 0.2;
      }
    }

    if (act === 'celebrate') {
      if (state.satiety >= 80 && state.energy >= 80 && state.fun >= 80) {
        weight *= 2.0;
      } else {
        weight = 0;
      }
    }

    candidates.push({ item: act, weight: Math.max(0.1, weight) });
  }

  // Choose activity deterministically
  const choiceResult = weightedChoice(rng, candidates);
  const chosenActivity = choiceResult.value;
  rng = choiceResult.nextState;

  // Determine duration for the chosen activity
  let minDuration = config.decisionIntervalMs.min;
  let maxDuration = config.decisionIntervalMs.max;

  if (chosenActivity === 'look_around' || chosenActivity === 'stretch' || chosenActivity === 'yawn') {
    minDuration = 3000;
    maxDuration = 6000;
  } else if (chosenActivity === 'bounce' || chosenActivity === 'hum' || chosenActivity === 'celebrate') {
    minDuration = 4000;
    maxDuration = 8000;
  } else if (chosenActivity === 'daydream' || chosenActivity === 'inspect_something' || chosenActivity === 'self_play') {
    minDuration = 6000;
    maxDuration = 12000;
  } else if (chosenActivity === 'nap') {
    minDuration = config.sleepParameters.minSleepDurationMs;
    maxDuration = config.sleepParameters.minSleepDurationMs * 2;
  }

  const { value: duration, nextState: rngAfterDuration } = randomIntRange(
    rng,
    minDuration,
    maxDuration
  );
  rng = rngAfterDuration;

  // Apply immediate state effects of chosen activity
  let nextSatiety = state.satiety;
  let nextEnergy = state.energy;
  let nextFun = state.fun;
  let nextSocial = state.social;
  let nextSleepState: PetSleepState = state.sleepState;

  if (chosenActivity === 'self_play') {
    nextFun = clampNeed(state.fun + 8);
    nextEnergy = clampNeed(state.energy - 4);
  } else if (chosenActivity === 'bounce') {
    nextFun = clampNeed(state.fun + 2);
    nextEnergy = clampNeed(state.energy - 1);
  } else if (chosenActivity === 'nap') {
    nextSleepState = 'asleep';
    lifeEvents.push({
      petId: state.petId,
      eventType: 'sleep.started',
      occurredAt: now,
      importance: 0.3,
      payloadJson: JSON.stringify({ reason: 'autonomous_nap' }),
    });
  }

  // Determine if a thought / speech bubble should be triggered
  let speechBubble: { text: string; category?: string; priority: 'low' | 'normal' | 'urgent' } | undefined;
  const timeSinceLastSpeech = now - state.lastSpeechAt;
  const canSpeak = timeSinceLastSpeech >= config.speechCooldownMs;

  let speechCategory: string | null = null;
  let priority: 'low' | 'normal' | 'urgent' = 'low';

  if (chosenActivity === 'complain_hungry' && (canSpeak || state.satiety <= critical)) {
    speechCategory = 'needs.hungry';
    priority = state.satiety <= critical ? 'urgent' : 'normal';
  } else if (chosenActivity === 'complain_bored' && canSpeak) {
    speechCategory = 'needs.bored';
    priority = 'normal';
  } else if (chosenActivity === 'complain_lonely' && canSpeak) {
    speechCategory = 'needs.lonely';
    priority = 'normal';
  } else if (chosenActivity === 'seek_attention' && canSpeak) {
    speechCategory = 'activity.seek_attention';
    priority = 'normal';
  } else if (chosenActivity === 'daydream' && canSpeak) {
    speechCategory = 'activity.daydream';
    priority = 'low';
  } else if (chosenActivity === 'yawn' && canSpeak && state.energy <= low) {
    speechCategory = 'activity.yawn';
    priority = 'low';
  }

  let nextLastSpeechAt = state.lastSpeechAt;
  if (speechCategory) {
    const pool = reactions.pools[speechCategory];
    if (pool && pool.length > 0) {
      const textChoice = randomChoice(rng, pool);
      rng = textChoice.nextState;
      speechBubble = {
        text: textChoice.value,
        category: speechCategory,
        priority,
      };
      nextLastSpeechAt = now;
    }
  }

  const nextState: PetState = {
    ...state,
    satiety: nextSatiety,
    energy: nextEnergy,
    fun: nextFun,
    social: nextSocial,
    sleepState: nextSleepState,
    currentActivity: chosenActivity,
    activityStartedAt: now,
    activityDurationMs: duration,
    simulationUpdatedAt: now,
    lastSpeechAt: nextLastSpeechAt,
    rngState: rng,
    revision: state.revision + 1,
  };

  return {
    nextState,
    speechBubble,
    lifeEvents,
  };
}
