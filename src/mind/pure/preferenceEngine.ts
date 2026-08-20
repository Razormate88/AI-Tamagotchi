import { PetPreference } from '../model/mindState';
import { PreferenceTuningConfig } from '../model/mindConfig';
import { clamp } from '../../simulation/time/timeUtils';

export interface PreferenceSampleContext {
  satiety?: number;
  energy?: number;
  fun?: number;
  social?: number;
  pokeCount?: number;
  source?: string;
  [key: string]: any;
}

/**
 * Calculates evidence sample valence (-100 to +100) for an interaction based on Gloop's state at the time.
 */
export function calculateSampleValence(
  interactionKey: string,
  context: PreferenceSampleContext
): number | null {
  switch (interactionKey) {
    case 'interaction.feed': {
      const satiety = context.satiety ?? 50;
      if (satiety < 40) return 75; // Loved eating when hungry
      if (satiety >= 90) return -55; // Disliked being force-fed when stuffed
      return 35; // Neutral pleasant snack
    }

    case 'interaction.pet': {
      const social = context.social ?? 50;
      if (social < 30) return 85; // Deeply comforted when lonely
      return 50; // Pleasant pet
    }

    case 'interaction.play': {
      const energy = context.energy ?? 50;
      const fun = context.fun ?? 50;
      if (energy < 25) return -65; // Hated being forced to play while exhausted
      if (fun < 40) return 80; // Loved playing when bored
      return 55;
    }

    case 'interaction.poke': {
      const pokes = context.pokeCount ?? 1;
      if (pokes >= 3) return -80; // Annoyed by poke spam
      return 15; // Mild playful boop
    }

    case 'interaction.sleep': {
      const energy = context.energy ?? 50;
      if (energy < 40) return 70; // Desired nap
      return 20;
    }

    case 'interaction.wake': {
      const energy = context.energy ?? 50;
      if (energy < 30) return -85; // Hated being woken up while exhausted
      return 45;
    }

    default:
      return null;
  }
}

/**
 * Updates a preference with a new evidence sample using Bayesian-like progressive confidence.
 */
export function updatePreferenceWithSample(
  current: PetPreference | null,
  petId: string,
  key: string,
  sampleValence: number,
  now: number,
  config: PreferenceTuningConfig
): PetPreference {
  const currentCount = current?.sampleCount ?? 0;
  const newCount = currentCount + 1;
  const currentAffinity = current?.affinity ?? 0;

  // Weight decreases with sample count so early samples give direction, later samples refine
  const sampleWeight = 1.0 / Math.sqrt(newCount);
  const alpha = (config.learningRate / 100) * sampleWeight;

  const newAffinity = clamp(
    currentAffinity + (sampleValence - currentAffinity) * alpha,
    -100,
    100
  );
  const newConfidence = Math.min(1.0, newCount / config.confidenceSamplesRequired);

  return {
    petId,
    preferenceKey: key,
    affinity: Math.round(newAffinity * 10) / 10,
    confidence: Math.round(newConfidence * 100) / 100,
    sampleCount: newCount,
    updatedAt: now,
  };
}
