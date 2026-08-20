import { RelationshipState, PersonalityState } from './mindState';

export interface RelationshipScalingConfig {
  feedHungryAffection: number;
  feedFullAffection: number;
  petAffection: number;
  petLonelyBonus: number;
  playAffection: number;
  playTiredAffection: number;
  pokeAnnoyance: number;
  repeatedPokeAnnoyance: number;
  wakeExhaustedAnnoyance: number;
  wakeReluctantTrustPenalty: number;
  returnFamiliarityGain: number;
  interactionFamiliarityGain: number;
  absenceTrustDecayPerDay: number;
  annoyanceHalfLifeHours: number;
}

export interface PersonalityDriftConfig {
  maxDriftFromBaseline: number;
  playImpactOnPlayfulness: number;
  exploreImpactOnCuriosity: number;
  petImpactOnAffectionateness: number;
  pokeImpactOnMischief: number;
  pokeImpactOnPatience: number;
  comfortAloneImpactOnIndependence: number;
}

export interface MemoryTuningConfig {
  decayHalfLifeDays: {
    mundane: number;
    moderate: number;
    major: number;
  };
  pruneThresholdStrength: number;
  maxDurableMemories: number;
  maxDreams: number;
  recallCooldownMs: number;
  salienceThresholds: {
    first: number;
    majorAbsenceHours: number;
    moderateAbsenceHours: number;
  };
}

export interface PreferenceTuningConfig {
  confidenceSamplesRequired: number;
  learningRate: number;
}

export interface HabitTuningConfig {
  minSamplesForConfidence: number;
  acknowledgementCooldownMs: number;
}

export interface DreamTuningConfig {
  minSleepDurationMs: number;
  baseDreamChance: number;
  dreamCooldownMs: number;
}

export interface BondStageConfig {
  id: string;
  name: string;
  description: string;
  minFamiliarity: number;
  minAffection: number;
  minTrust: number;
}

export interface SpeciesMindConfig {
  schemaVersion: string;
  speciesId: string;
  relationshipBaselines: RelationshipState;
  relationshipScaling: RelationshipScalingConfig;
  personalityBaselines: PersonalityState;
  personalityDriftRates: PersonalityDriftConfig;
  memoryTuning: MemoryTuningConfig;
  preferenceTuning: PreferenceTuningConfig;
  habitTuning: HabitTuningConfig;
  dreamTuning: DreamTuningConfig;
  bondStages: BondStageConfig[];
}
