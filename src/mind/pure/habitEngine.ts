import { PetHabit } from '../model/mindState';

export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Maps a local timestamp to a broad time-of-day bucket.
 */
export function getTimeBucket(timestamp: number): TimeBucket {
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Returns a human-friendly label for a time bucket.
 */
export function getTimeBucketLabel(bucket: TimeBucket): string {
  switch (bucket) {
    case 'morning': return 'mornings';
    case 'afternoon': return 'afternoons';
    case 'evening': return 'evenings';
    case 'night': return 'late nights';
  }
}

/**
 * Updates a habit record with a new observation.
 */
export function recordHabitObservation(
  current: PetHabit | null,
  petId: string,
  habitKey: string,
  now: number,
  payload: Record<string, any> = {}
): PetHabit {
  const sampleCount = (current?.sampleCount ?? 0) + 1;
  // Strength grows towards 100 with consistent samples
  const prevStrength = current?.strength ?? 0;
  const newStrength = Math.min(100, prevStrength + (100 - prevStrength) * 0.2);

  return {
    petId,
    habitKey,
    strength: Math.round(newStrength * 10) / 10,
    sampleCount,
    lastObservedAt: now,
    payloadJson: JSON.stringify({ ...payload, lastBucket: getTimeBucket(now) }),
  };
}

/**
 * Checks if a habit is statistically meaningful and confident.
 */
export function isHabitConfident(
  habit: PetHabit | null,
  minSamples: number = 4,
  minStrength: number = 50
): boolean {
  if (!habit) return false;
  return habit.sampleCount >= minSamples && habit.strength >= minStrength;
}
