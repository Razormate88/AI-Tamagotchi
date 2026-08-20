import { PetState } from '../model/petState';
import { SpeciesLifeConfig } from '../model/speciesLife';

export const MS_PER_HOUR = 3600000;

/**
 * Clamps a numerical value to a range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Clamps a Tamagotchi need value strictly to [0, 100].
 */
export function clampNeed(value: number): number {
  return clamp(value, 0, 100);
}

/**
 * Computes awake need decay over an elapsed duration in milliseconds.
 */
export function computeAwakeNeeds(
  state: PetState,
  elapsedMs: number,
  config: SpeciesLifeConfig
): { satiety: number; energy: number; fun: number; social: number } {
  const hours = Math.max(0, elapsedMs) / MS_PER_HOUR;
  const rates = config.decayRatesAwakePerHour;

  return {
    satiety: clampNeed(state.satiety - rates.satiety * hours),
    energy: clampNeed(state.energy - rates.energy * hours),
    fun: clampNeed(state.fun - rates.fun * hours),
    social: clampNeed(state.social - rates.social * hours),
  };
}

/**
 * Computes sleeping need decay and energy recovery over an elapsed duration in milliseconds.
 */
export function computeAsleepNeeds(
  state: PetState,
  elapsedMs: number,
  config: SpeciesLifeConfig
): { satiety: number; energy: number; fun: number; social: number } {
  const hours = Math.max(0, elapsedMs) / MS_PER_HOUR;
  const rates = config.decayRatesAsleepPerHour;

  return {
    satiety: clampNeed(state.satiety - rates.satiety * hours),
    energy: clampNeed(state.energy + rates.energyRecovery * hours),
    fun: clampNeed(state.fun - rates.fun * hours),
    social: clampNeed(state.social - rates.social * hours),
  };
}
