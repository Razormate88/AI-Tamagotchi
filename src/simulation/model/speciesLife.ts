import { PetActivityType } from './petState';

export interface DecayRatesAwake {
  satiety: number;
  energy: number;
  fun: number;
  social: number;
}

export interface DecayRatesAsleep {
  satiety: number;
  energyRecovery: number;
  fun: number;
  social: number;
}

export interface NeedThresholds {
  criticalLow: number;
  low: number;
  high: number;
  satisfied: number;
}

export interface SleepParameters {
  tiredEnergyThreshold: number;
  restedEnergyThreshold: number;
  minSleepDurationMs: number;
}

export interface DecisionIntervalMs {
  min: number;
  max: number;
}

export interface InteractionFeedConfig {
  satietyDelta: number;
  funDelta: number;
  socialDelta: number;
  fullThreshold: number;
}

export interface InteractionPetConfig {
  socialDelta: number;
  funDelta: number;
  cooldownMs: number;
}

export interface InteractionPlayConfig {
  funDelta: number;
  socialDelta: number;
  energyDelta: number;
  satietyDelta: number;
  minEnergyRequired: number;
}

export interface InteractionPokeConfig {
  funDelta: number;
  repeatedPokeThresholdMs: number;
  repeatedPokeCountAnnoy: number;
}

export interface InteractionSleepConfig {
  allowed: boolean;
}

export interface InteractionWakeConfig {
  allowed: boolean;
  reluctantEnergyThreshold: number;
}

export interface InteractionEffectsConfig {
  feed: InteractionFeedConfig;
  pet: InteractionPetConfig;
  play: InteractionPlayConfig;
  poke: InteractionPokeConfig;
  sleep: InteractionSleepConfig;
  wake: InteractionWakeConfig;
}

export interface ReturnIntervalsConfig {
  shortMs: number;
  mediumMs: number;
  longMs: number;
}

export interface SpeciesLifeConfig {
  schemaVersion: string;
  speciesId: string;
  decayRatesAwakePerHour: DecayRatesAwake;
  decayRatesAsleepPerHour: DecayRatesAsleep;
  thresholds: NeedThresholds;
  sleepParameters: SleepParameters;
  decisionIntervalMs: DecisionIntervalMs;
  speechCooldownMs: number;
  temperamentModifiers: Record<string, Partial<Record<PetActivityType, number>>>;
  activityWeights: Partial<Record<PetActivityType, number>>;
  interactionEffects: InteractionEffectsConfig;
  returnIntervalsMs: ReturnIntervalsConfig;
}
