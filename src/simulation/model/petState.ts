/**
 * Core types and data models for durable creature state, moods, activities, and events.
 */

export type PetSleepState = 'awake' | 'asleep';

export type PetMood =
  | 'asleep'
  | 'excited'
  | 'happy'
  | 'content'
  | 'bored'
  | 'lonely'
  | 'hungry'
  | 'tired'
  | 'grumpy';

export type PetActivityType =
  | 'idle'
  | 'look_around'
  | 'stretch'
  | 'bounce'
  | 'hum'
  | 'daydream'
  | 'self_play'
  | 'inspect_something'
  | 'seek_attention'
  | 'complain_hungry'
  | 'complain_bored'
  | 'complain_lonely'
  | 'yawn'
  | 'nap'
  | 'sleep'
  | 'wake'
  | 'celebrate'
  | 'sulk';

/**
 * Authoritative durable state of a companion instance.
 * Persisted in SQLite `pet_state` table.
 */
export interface PetState {
  petId: string;
  satiety: number;             // [0, 100]
  energy: number;              // [0, 100]
  fun: number;                 // [0, 100]
  social: number;              // [0, 100]
  sleepState: PetSleepState;
  currentActivity: PetActivityType;
  activityStartedAt: number;
  activityDurationMs: number;
  simulationUpdatedAt: number;
  lastInteractionAt: number;
  lastSpeechAt: number;
  totalAwakeMs: number;
  totalAsleepMs: number;
  rngState: number;
  revision: number;
}

/**
 * Local life timeline event for episodic memory seeding.
 * Stored in SQLite `pet_life_events` table.
 */
export interface PetLifeEvent {
  id?: number;
  petId: string;
  eventType: string;
  occurredAt: number;
  importance: number;          // [0, 1]
  payloadJson: string;
}

/**
 * Active companion speech / thought bubble.
 */
export interface SpeechBubbleState {
  text: string;
  category?: string;
  priority: 'low' | 'normal' | 'urgent';
  expiresAt: number;
}

/**
 * Public snapshot emitted from the main simulation owner to UI views.
 */
export interface SimulationSnapshot {
  state: PetState;
  mood: PetMood;
  speech: SpeechBubbleState | null;
}

/**
 * Initial baseline seed values for a newly created or first-migrated pet.
 */
export function createDefaultPetState(petId: string, now: number = Date.now(), seed: number = 1337): PetState {
  return {
    petId,
    satiety: 80,
    energy: 85,
    fun: 75,
    social: 75,
    sleepState: 'awake',
    currentActivity: 'idle',
    activityStartedAt: now,
    activityDurationMs: 12000,
    simulationUpdatedAt: now,
    lastInteractionAt: now,
    lastSpeechAt: 0,
    totalAwakeMs: 0,
    totalAsleepMs: 0,
    rngState: (seed >>> 0) || 1,
    revision: 1,
  };
}
