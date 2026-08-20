import { PetMood, PetState } from '../model/petState';
import { SpeciesLifeConfig } from '../model/speciesLife';

/**
 * Deterministically derives the pet's current mood based on state, needs, and recent events.
 */
export function deriveMood(
  state: PetState,
  now: number,
  config: SpeciesLifeConfig
): PetMood {
  // 1. Asleep always overrides other moods
  if (state.sleepState === 'asleep' || state.currentActivity === 'sleep' || state.currentActivity === 'nap') {
    return 'asleep';
  }

  const { satiety, energy, fun, social } = state;
  const critical = config.thresholds.criticalLow; // 15
  const low = config.thresholds.low; // 30
  const high = config.thresholds.high; // 70

  // Count how many needs are in low/critical condition
  let lowNeedsCount = 0;
  if (satiety <= low) lowNeedsCount++;
  if (energy <= low) lowNeedsCount++;
  if (fun <= low) lowNeedsCount++;
  if (social <= low) lowNeedsCount++;

  // 2. Multiple low needs = grumpy / overwhelmed
  if (lowNeedsCount >= 2) {
    return 'grumpy';
  }

  // 3. Single acute need deficits (in priority order: exhaustion > hunger > loneliness > boredom)
  if (energy <= critical || energy <= config.sleepParameters.tiredEnergyThreshold) {
    return 'tired';
  }
  if (satiety <= critical || satiety <= low) {
    return 'hungry';
  }
  if (social <= critical || social <= low) {
    return 'lonely';
  }
  if (fun <= critical || fun <= low) {
    return 'bored';
  }

  // 4. Positive and elevated states
  const recentInteractionDuration = now - state.lastInteractionAt;
  const hasRecentPositiveInteraction = recentInteractionDuration < 180000; // within 3 minutes

  const isAllHigh = satiety >= high && energy >= high && fun >= high && social >= high;
  const isAverageHigh = (satiety + energy + fun + social) / 4 >= high;

  if (state.currentActivity === 'celebrate' || (isAllHigh && hasRecentPositiveInteraction)) {
    return 'excited';
  }

  if (isAverageHigh || (hasRecentPositiveInteraction && satiety >= 50 && energy >= 50)) {
    return 'happy';
  }

  // 5. Default healthy neutral baseline
  return 'content';
}
