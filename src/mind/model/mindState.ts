/**
 * Authoritative in-memory and database models for Gloop's Mind state.
 */

export interface RelationshipState {
  affection: number; // 0..100
  trust: number; // 0..100
  familiarity: number; // 0..100
  annoyance: number; // 0..100
}

export interface PersonalityState {
  curiosity: number; // 0..100
  playfulness: number; // 0..100
  affectionateness: number; // 0..100
  mischief: number; // 0..100
  independence: number; // 0..100
  patience: number; // 0..100
}

export interface PetMindState extends RelationshipState, PersonalityState {
  petId: string;
  processedLifeEventId: number;
  mindUpdatedAt: number;
  revision: number;
}

export type MemoryType =
  | 'first'
  | 'care'
  | 'absence'
  | 'return'
  | 'sleep'
  | 'mood'
  | 'milestone'
  | 'pattern'
  | 'conflict'
  | 'affection'
  | 'achievement'
  | 'dream'
  | 'quirk';

export interface PetMemory {
  id?: number;
  petId: string;
  memoryType: MemoryType;
  subjectKey: string;
  formedAt: number;
  lastReinforcedAt: number;
  lastRecalledAt: number | null;
  salience: number; // 0..1
  strength: number; // 0..1
  valence: number; // -1..+1
  reinforcementCount: number;
  protected: number; // 0 | 1
  payloadJson: string;
}

export interface PetPreference {
  petId: string;
  preferenceKey: string;
  affinity: number; // -100..+100
  confidence: number; // 0..1
  sampleCount: number;
  updatedAt: number;
}

export interface PetHabit {
  petId: string;
  habitKey: string;
  strength: number; // 0..100
  sampleCount: number;
  lastObservedAt: number;
  payloadJson: string;
}

export interface PetUnlock {
  petId: string;
  unlockKey: string;
  unlockedAt: number;
  payloadJson: string;
}

export interface FormattedPreference {
  key: string;
  label: string;
  icon: string;
  affinity: number;
  confidence: number;
  description: string;
}

export interface FormattedMemoryCard {
  id: number;
  icon: string;
  description: string;
  relativeTime: string;
  valence: number;
  isProtected: boolean;
  memoryType: MemoryType;
  subjectKey: string;
}

export interface FormattedDreamCard {
  id: number;
  text: string;
  formedAt: number;
  relativeTime: string;
}

export interface FormattedUnlockBadge {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
}

export interface MindPresentationSnapshot {
  petId: string;
  bond: {
    stageId: string;
    stageName: string;
    stageDescription: string;
    affection: number;
    trust: number;
    familiarity: number;
    annoyance: number;
  };
  personality: {
    curiosity: number;
    playfulness: number;
    affectionateness: number;
    mischief: number;
    independence: number;
    patience: number;
  };
  preferences: FormattedPreference[];
  memories: FormattedMemoryCard[];
  dreams: FormattedDreamCard[];
  unlocks: FormattedUnlockBadge[];
  stats: {
    memoryCount: number;
    dreamCount: number;
    unlockCount: number;
    lastProcessedEventId: number;
  };
}
