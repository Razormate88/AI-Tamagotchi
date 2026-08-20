import { PersonalityState } from '../model/mindState';
import { PersonalityDriftConfig } from '../model/mindConfig';
import { clamp } from '../../simulation/time/timeUtils';
import { PetActivityType } from '../../simulation/model/petState';

export function clampTraitValue(val: number): number {
  return clamp(val, 0, 100);
}

/**
 * Calculates personality drift with diminishing returns and strict baseline bounds.
 */
export function applyPersonalityDrift(
  current: PersonalityState,
  deltas: Partial<PersonalityState>,
  baselines: PersonalityState,
  config: PersonalityDriftConfig
): PersonalityState {
  const result: PersonalityState = { ...current };
  const maxDrift = config.maxDriftFromBaseline;

  const traits: (keyof PersonalityState)[] = [
    'curiosity',
    'playfulness',
    'affectionateness',
    'mischief',
    'independence',
    'patience',
  ];

  for (const trait of traits) {
    const rawDelta = deltas[trait];
    if (rawDelta === undefined || rawDelta === 0) continue;

    const base = baselines[trait];
    const curr = current[trait];
    const currentDrift = curr - base;

    // Calculate diminishing returns factor based on how close we are to max drift in that direction
    let factor = 1.0;
    if (rawDelta > 0 && currentDrift >= 0) {
      factor = Math.max(0, 1.0 - currentDrift / maxDrift);
    } else if (rawDelta < 0 && currentDrift <= 0) {
      factor = Math.max(0, 1.0 - Math.abs(currentDrift) / maxDrift);
    }

    const effectiveDelta = rawDelta * factor;
    const minAllowed = Math.max(0, base - maxDrift);
    const maxAllowed = Math.min(100, base + maxDrift);

    result[trait] = clamp(curr + effectiveDelta, minAllowed, maxAllowed);
  }

  return result;
}

/**
 * Derives personality deltas for an event.
 */
export function calculatePersonalityDeltas(
  eventType: string,
  context: { activity?: string; pokeCount?: number; aloneHours?: number; [key: string]: any },
  config: PersonalityDriftConfig
): Partial<PersonalityState> {
  const deltas: Partial<PersonalityState> = {};

  switch (eventType) {
    case 'interaction.play':
      deltas.playfulness = config.playImpactOnPlayfulness;
      break;

    case 'interaction.pet':
      deltas.affectionateness = config.petImpactOnAffectionateness;
      deltas.patience = 0.01;
      break;

    case 'interaction.poke':
      deltas.mischief = config.pokeImpactOnMischief;
      deltas.patience = config.pokeImpactOnPatience;
      break;

    case 'activity.daydream':
    case 'activity.inspect_something':
      deltas.curiosity = config.exploreImpactOnCuriosity;
      break;

    case 'activity.self_play':
      deltas.playfulness = config.playImpactOnPlayfulness * 0.5;
      deltas.independence = config.comfortAloneImpactOnIndependence;
      break;

    case 'offline.catchup': {
      const hours = context.aloneHours ?? 0;
      if (hours >= 4) {
        deltas.independence = config.comfortAloneImpactOnIndependence * Math.min(5, hours / 4);
      }
      break;
    }

    default:
      break;
  }

  return deltas;
}

/**
 * Computes subtle multipliers for autonomous activity scoring based on evolved personality traits.
 * Keeps needs as the dominant signal while providing noticeable personality flavor.
 */
export function getPersonalityActivityModifiers(
  personality: PersonalityState,
  baselines: PersonalityState
): Partial<Record<PetActivityType, number>> {
  const mods: Partial<Record<PetActivityType, number>> = {};

  // Trait deviations from baseline (-25..+25 scale)
  const curiosityDiff = (personality.curiosity - baselines.curiosity) / 50; // roughly -0.5..+0.5
  const playfulnessDiff = (personality.playfulness - baselines.playfulness) / 50;
  const affectionDiff = (personality.affectionateness - baselines.affectionateness) / 50;
  const mischiefDiff = (personality.mischief - baselines.mischief) / 50;
  const independenceDiff = (personality.independence - baselines.independence) / 50;

  // Modest multipliers [0.6 .. 1.5]
  mods.inspect_something = 1.0 + curiosityDiff * 0.4;
  mods.daydream = 1.0 + curiosityDiff * 0.3;
  mods.look_around = 1.0 + curiosityDiff * 0.2;

  mods.bounce = 1.0 + playfulnessDiff * 0.4 + mischiefDiff * 0.2;
  mods.self_play = 1.0 + playfulnessDiff * 0.4 + independenceDiff * 0.2;
  mods.celebrate = 1.0 + playfulnessDiff * 0.3 + affectionDiff * 0.2;

  // Higher independence slightly reduces attention seeking, higher affection increases it
  mods.seek_attention = Math.max(0.4, 1.0 + affectionDiff * 0.4 - independenceDiff * 0.3);
  mods.sulk = 1.0 + mischiefDiff * 0.3;

  return mods;
}
