import { RelationshipState } from '../model/mindState';
import { BondStageConfig, RelationshipScalingConfig } from '../model/mindConfig';
import { clamp } from '../../simulation/time/timeUtils';

export function clampRelationshipValue(val: number): number {
  return clamp(val, 0, 100);
}

/**
 * Derives the active Bond Stage by evaluating relationship dimensions against configured thresholds.
 */
export function deriveBondStage(
  state: RelationshipState,
  stages: BondStageConfig[]
): BondStageConfig {
  if (!stages || stages.length === 0) {
    return {
      id: 'new_creature',
      name: 'New Creature',
      description: 'A new companion on your desktop.',
      minFamiliarity: 0,
      minAffection: 0,
      minTrust: 0,
    };
  }

  // Evaluate stages from highest threshold to lowest
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i];
    if (
      state.familiarity >= stage.minFamiliarity &&
      state.affection >= stage.minAffection &&
      state.trust >= stage.minTrust
    ) {
      return stage;
    }
  }

  return stages[0];
}

/**
 * Applies analytical exponential decay to annoyance based on elapsed wall-clock time.
 */
export function decayAnnoyance(
  currentAnnoyance: number,
  elapsedMs: number,
  halfLifeHours: number
): number {
  if (currentAnnoyance <= 0 || elapsedMs <= 0) return Math.max(0, currentAnnoyance);
  const halfLifeMs = Math.max(1000, halfLifeHours * 3600000);
  const decayed = currentAnnoyance * Math.pow(0.5, elapsedMs / halfLifeMs);
  return decayed < 0.05 ? 0 : clampRelationshipValue(decayed);
}

export interface RelationshipContext {
  satiety?: number;
  energy?: number;
  fun?: number;
  social?: number;
  pokeCount?: number;
  absenceHours?: number;
  [key: string]: any;
}

/**
 * Evaluates relationship deltas resulting from an event.
 */
export function calculateRelationshipDeltas(
  eventType: string,
  context: RelationshipContext,
  scaling: RelationshipScalingConfig
): Partial<RelationshipState> {
  const deltas: Partial<RelationshipState> = {};

  switch (eventType) {
    case 'interaction.feed': {
      deltas.familiarity = scaling.interactionFamiliarityGain;
      const wasHungry = (context.satiety ?? 50) < 40;
      const wasFull = (context.satiety ?? 50) >= 90;

      if (wasHungry) {
        deltas.affection = scaling.feedHungryAffection;
        deltas.trust = 0.5;
      } else if (wasFull) {
        deltas.affection = scaling.feedFullAffection;
      } else {
        deltas.affection = scaling.feedHungryAffection * 0.5;
      }
      break;
    }

    case 'interaction.pet': {
      deltas.familiarity = scaling.interactionFamiliarityGain;
      const wasLonely = (context.social ?? 50) < 30;
      deltas.affection = wasLonely
        ? scaling.petAffection + scaling.petLonelyBonus
        : scaling.petAffection;
      deltas.trust = wasLonely ? 1.0 : 0.2;
      break;
    }

    case 'interaction.play': {
      deltas.familiarity = scaling.interactionFamiliarityGain * 1.5;
      const wasTired = (context.energy ?? 50) < 25;
      if (wasTired) {
        deltas.affection = scaling.playTiredAffection;
      } else {
        deltas.affection = scaling.playAffection;
        deltas.trust = 0.5;
      }
      break;
    }

    case 'interaction.poke': {
      const pokes = context.pokeCount ?? 1;
      if (pokes >= 3) {
        deltas.annoyance = scaling.repeatedPokeAnnoyance;
        deltas.affection = -0.5;
        deltas.trust = -0.3;
      } else {
        deltas.annoyance = scaling.pokeAnnoyance;
      }
      break;
    }

    case 'sleep.woke': {
      if (context.source === 'manual_request' && (context.energy ?? 100) < 30) {
        // Woken up while exhausted
        deltas.annoyance = scaling.wakeExhaustedAnnoyance;
        deltas.trust = scaling.wakeReluctantTrustPenalty;
      }
      break;
    }

    case 'owner.returned': {
      const hours = context.absenceHours ?? 0;
      if (hours >= 1) {
        // Return familiarity scales with absence length
        const famGain = Math.min(15, scaling.returnFamiliarityGain * Math.log2(Math.max(2, hours)));
        deltas.familiarity = famGain;
        deltas.trust = 1.0;
      }
      break;
    }

    default:
      break;
  }

  return deltas;
}

/**
 * Applies relationship deltas cleanly to state, ensuring all dimensions stay bounded [0..100].
 */
export function applyRelationshipDeltas(
  current: RelationshipState,
  deltas: Partial<RelationshipState>
): RelationshipState {
  return {
    affection: clampRelationshipValue(current.affection + (deltas.affection ?? 0)),
    trust: clampRelationshipValue(current.trust + (deltas.trust ?? 0)),
    // Familiarity should only increase or stay same
    familiarity: clampRelationshipValue(Math.max(current.familiarity, current.familiarity + (deltas.familiarity ?? 0))),
    annoyance: clampRelationshipValue(current.annoyance + (deltas.annoyance ?? 0)),
  };
}
