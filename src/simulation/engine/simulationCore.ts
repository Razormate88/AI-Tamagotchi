import {
  PetActivityType,
  PetLifeEvent,
  PetMood,
  PetState,
  SpeechBubbleState,
} from '../model/petState';
import { SpeciesLifeConfig } from '../model/speciesLife';
import { SpeciesReactionPack } from '../model/reactions';
import { computeAsleepNeeds, computeAwakeNeeds } from '../time/timeUtils';
import { deriveMood } from '../mood/moodEngine';
import { evaluateAutonomousDecision } from '../behavior/autonomousEngine';
import { applyInteraction, InteractionResult, InteractionType } from './interactionEngine';
import { advanceOfflineSimulation, OfflineCatchupResult } from './offlineEngine';

export interface SimulationStepResult {
  nextState: PetState;
  mood: PetMood;
  speechBubble?: SpeechBubbleState;
  lifeEvents: PetLifeEvent[];
}

/**
 * Pure Simulation Core Facade.
 * Completely deterministic and free of React, Tauri, SQLite, or Date.now() side effects.
 */
export class SimulationCore {
  /**
   * Advances wall-clock simulation by the elapsed time between `state.simulationUpdatedAt` and `now`.
   * Also evaluates autonomous activity transitions when the current activity expires.
   */
  public static step(
    state: PetState,
    now: number,
    config: SpeciesLifeConfig,
    reactions: SpeciesReactionPack,
    temperament: readonly string[] = [],
    personalityModifiers?: Partial<Record<PetActivityType, number>>
  ): SimulationStepResult {
    const elapsedMs = Math.max(0, now - state.simulationUpdatedAt);
    const lifeEvents: PetLifeEvent[] = [];

    // 1. Advance needs continuously based on elapsed wall-clock time
    let updatedNeeds: { satiety: number; energy: number; fun: number; social: number };
    let awakeDelta = 0;
    let asleepDelta = 0;

    if (state.sleepState === 'asleep') {
      updatedNeeds = computeAsleepNeeds(state, elapsedMs, config);
      asleepDelta = elapsedMs;
    } else {
      updatedNeeds = computeAwakeNeeds(state, elapsedMs, config);
      awakeDelta = elapsedMs;
    }

    let workingState: PetState = {
      ...state,
      satiety: updatedNeeds.satiety,
      energy: updatedNeeds.energy,
      fun: updatedNeeds.fun,
      social: updatedNeeds.social,
      simulationUpdatedAt: now,
      totalAwakeMs: state.totalAwakeMs + awakeDelta,
      totalAsleepMs: state.totalAsleepMs + asleepDelta,
    };

    let activeSpeech: SpeechBubbleState | undefined;

    // 2. Check if current activity has expired -> choose next autonomous behavior
    const isActivityExpired = (now - workingState.activityStartedAt) >= workingState.activityDurationMs;
    if (isActivityExpired) {
      const decision = evaluateAutonomousDecision(
        workingState,
        now,
        config,
        reactions,
        temperament,
        personalityModifiers
      );
      workingState = decision.nextState;
      lifeEvents.push(...decision.lifeEvents);

      if (decision.speechBubble) {
        activeSpeech = {
          text: decision.speechBubble.text,
          category: decision.speechBubble.category,
          priority: decision.speechBubble.priority,
          expiresAt: now + 4000,
        };
      }
    }

    // 3. Derive current mood
    const mood = deriveMood(workingState, now, config);

    return {
      nextState: workingState,
      mood,
      speechBubble: activeSpeech,
      lifeEvents,
    };
  }

  /**
   * Fast O(1) offline catch-up for application startup / resume.
   */
  public static catchup(
    state: PetState,
    now: number,
    config: SpeciesLifeConfig,
    reactions: SpeciesReactionPack
  ): OfflineCatchupResult {
    return advanceOfflineSimulation(state, now, config, reactions);
  }

  /**
   * Applies an authoritative manual interaction (feed, pet, play, poke, sleep, wake).
   */
  public static interact(
    state: PetState,
    type: InteractionType,
    now: number,
    config: SpeciesLifeConfig,
    reactions: SpeciesReactionPack,
    recentPokeCount: number = 0
  ): InteractionResult {
    return applyInteraction(state, type, now, config, reactions, recentPokeCount);
  }

  /**
   * Pure mood derivation helper.
   */
  public static getMood(
    state: PetState,
    now: number,
    config: SpeciesLifeConfig
  ): PetMood {
    return deriveMood(state, now, config);
  }
}
