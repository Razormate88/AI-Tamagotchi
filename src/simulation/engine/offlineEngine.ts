import { PetLifeEvent, PetState } from '../model/petState';
import { SpeciesLifeConfig } from '../model/speciesLife';
import { SpeciesReactionPack } from '../model/reactions';
import { MS_PER_HOUR, computeAsleepNeeds, computeAwakeNeeds } from '../time/timeUtils';
import { randomChoice, randomIntRange } from './rng';

export interface OfflineCatchupResult {
  nextState: PetState;
  lifeEvents: PetLifeEvent[];
  returnReaction?: {
    category: string;
    text: string;
  };
}

/**
 * Analytical, O(1) offline time advance.
 * Safely processes durations from seconds to months without per-tick loops.
 */
export function advanceOfflineSimulation(
  state: PetState,
  now: number,
  config: SpeciesLifeConfig,
  reactions: SpeciesReactionPack
): OfflineCatchupResult {
  const elapsedMs = Math.max(0, now - state.simulationUpdatedAt);
  let rng = state.rngState;
  const lifeEvents: PetLifeEvent[] = [];

  if (elapsedMs < 1000) {
    return {
      nextState: {
        ...state,
        simulationUpdatedAt: now,
      },
      lifeEvents: [],
    };
  }

  let nextSatiety = state.satiety;
  let nextEnergy = state.energy;
  let nextFun = state.fun;
  let nextSocial = state.social;
  let nextSleepState = state.sleepState;
  let awakeElapsedMs = 0;
  let asleepElapsedMs = 0;

  if (state.sleepState === 'asleep') {
    // Determine how long Gloop needs to sleep to reach full energy
    const energyNeeded = Math.max(0, 100 - state.energy);
    const recoveryRate = config.decayRatesAsleepPerHour.energyRecovery;
    const hoursToFull = recoveryRate > 0 ? energyNeeded / recoveryRate : 8;
    const estimatedSleepMs = Math.max(
      config.sleepParameters.minSleepDurationMs,
      hoursToFull * MS_PER_HOUR
    );

    if (elapsedMs <= estimatedSleepMs) {
      // Stayed asleep for the entire absence
      const needs = computeAsleepNeeds(state, elapsedMs, config);
      nextSatiety = needs.satiety;
      nextEnergy = needs.energy;
      nextFun = needs.fun;
      nextSocial = needs.social;
      asleepElapsedMs = elapsedMs;
    } else {
      // Woke up after sleeping estimatedSleepMs
      const sleepNeeds = computeAsleepNeeds(state, estimatedSleepMs, config);
      asleepElapsedMs = estimatedSleepMs;
      awakeElapsedMs = elapsedMs - estimatedSleepMs;

      // Transition to awake
      nextSleepState = 'awake';
      const interimState: PetState = {
        ...state,
        satiety: sleepNeeds.satiety,
        energy: 100, // fully rested
        fun: sleepNeeds.fun,
        social: sleepNeeds.social,
      };

      const awakeNeeds = computeAwakeNeeds(interimState, awakeElapsedMs, config);
      nextSatiety = awakeNeeds.satiety;
      nextEnergy = awakeNeeds.energy;
      nextFun = awakeNeeds.fun;
      nextSocial = awakeNeeds.social;

      lifeEvents.push({
        petId: state.petId,
        eventType: 'sleep.woke',
        occurredAt: state.simulationUpdatedAt + estimatedSleepMs,
        importance: 0.3,
        payloadJson: JSON.stringify({ reason: 'rested_offline' }),
      });
    }
  } else {
    // Was awake
    awakeElapsedMs = elapsedMs;
    const awakeNeeds = computeAwakeNeeds(state, elapsedMs, config);
    nextSatiety = awakeNeeds.satiety;
    nextEnergy = awakeNeeds.energy;
    nextFun = awakeNeeds.fun;
    nextSocial = awakeNeeds.social;
  }

  // Record offline catch-up life event if absence was meaningful (>= 5 minutes)
  const isMeaningfulAbsence = elapsedMs >= 300000;
  if (isMeaningfulAbsence) {
    const hours = (elapsedMs / MS_PER_HOUR).toFixed(2);
    lifeEvents.push({
      petId: state.petId,
      eventType: 'simulation.offline_catchup',
      occurredAt: now,
      importance: elapsedMs > 86400000 ? 0.8 : 0.4,
      payloadJson: JSON.stringify({
        elapsedMs,
        elapsedHours: hours,
        awakeElapsedMs,
        asleepElapsedMs,
      }),
    });
  }

  // Determine return reaction category based on public brain return intervals
  let returnReaction: { category: string; text: string } | undefined;
  if (isMeaningfulAbsence) {
    const { shortMs, mediumMs, longMs } = config.returnIntervalsMs;
    let poolKey = 'return.short';

    if (elapsedMs > longMs) {
      poolKey = 'return.very_long';
    } else if (elapsedMs > mediumMs) {
      poolKey = 'return.long';
    } else if (elapsedMs > shortMs) {
      poolKey = 'return.medium';
    } else {
      poolKey = 'return.short';
    }

    const pool = reactions.pools[poolKey] || reactions.pools['return.medium'];
    if (pool && pool.length > 0) {
      const choice = randomChoice(rng, pool);
      rng = choice.nextState;
      returnReaction = {
        category: poolKey,
        text: choice.value,
      };

      lifeEvents.push({
        petId: state.petId,
        eventType: 'owner.returned',
        occurredAt: now,
        importance: poolKey === 'return.very_long' ? 0.7 : 0.4,
        payloadJson: JSON.stringify({ poolKey, elapsedMs }),
      });
    }
  }

  // Determine post-catchup activity duration
  const { value: nextActivityDuration, nextState: rngAfterDuration } = randomIntRange(
    rng,
    config.decisionIntervalMs.min,
    config.decisionIntervalMs.max
  );

  const nextState: PetState = {
    ...state,
    satiety: nextSatiety,
    energy: nextEnergy,
    fun: nextFun,
    social: nextSocial,
    sleepState: nextSleepState,
    currentActivity: nextSleepState === 'asleep' ? 'sleep' : 'idle',
    activityStartedAt: now,
    activityDurationMs: nextActivityDuration,
    simulationUpdatedAt: now,
    totalAwakeMs: state.totalAwakeMs + awakeElapsedMs,
    totalAsleepMs: state.totalAsleepMs + asleepElapsedMs,
    rngState: rngAfterDuration,
    revision: state.revision + 1,
  };

  return {
    nextState,
    lifeEvents,
    returnReaction,
  };
}
