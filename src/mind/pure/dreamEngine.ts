import { PetMemory, PersonalityState } from '../model/mindState';
import { DreamTuningConfig } from '../model/mindConfig';
import { SpeciesDreamsConfig } from '../model/dreamTemplates';
import { nextRandom, randomChoice } from '../../simulation/engine/rng';

export interface DreamGenerationContext {
  petId: string;
  sleepDurationMs: number;
  lastDreamAt: number;
  recentMemories: PetMemory[];
  personality: PersonalityState;
  now: number;
  rngState: number;
}

export interface DreamGenerationResult {
  dreamMemory: PetMemory | null;
  wakeReactionBubble: string | null;
  nextRngState: number;
}

/**
 * Checks eligibility and deterministically creates a sleep dream memory and wake reaction.
 */
export function evaluateSleepDream(
  context: DreamGenerationContext,
  tuning: DreamTuningConfig,
  dreamBlueprint: SpeciesDreamsConfig
): DreamGenerationResult {
  let rng = context.rngState;

  // 1. Check eligibility: sleep duration
  if (context.sleepDurationMs < tuning.minSleepDurationMs) {
    return { dreamMemory: null, wakeReactionBubble: null, nextRngState: rng };
  }

  // 2. Check cooldown
  const timeSinceLastDream = context.now - context.lastDreamAt;
  if (timeSinceLastDream < tuning.dreamCooldownMs && context.lastDreamAt > 0) {
    return { dreamMemory: null, wakeReactionBubble: null, nextRngState: rng };
  }

  // 3. Probability check (first qualifying sleep is guaranteed so player discovers feature)
  const isFirstDream = context.lastDreamAt === 0;
  if (!isFirstDream) {
    const { value: roll, nextState: rngAfterRoll } = nextRandom(rng);
    rng = rngAfterRoll;
    if (roll > tuning.baseDreamChance) {
      return { dreamMemory: null, wakeReactionBubble: null, nextRngState: rng };
    }
  }

  // 4. Select theme based on recent memories and personality biases
  const candidateThemes: string[] = ['general'];

  // Check recent memory subjects
  for (const mem of context.recentMemories) {
    if (mem.subjectKey.includes('feed') || mem.subjectKey.includes('hungry')) {
      candidateThemes.push('food');
    }
    if (mem.subjectKey.includes('play') || mem.subjectKey.includes('bounce')) {
      candidateThemes.push('play');
    }
    if (mem.subjectKey.includes('poke') || mem.subjectKey.includes('conflict')) {
      candidateThemes.push('mischief');
    }
    if (mem.subjectKey.includes('absence') || mem.subjectKey.includes('return')) {
      candidateThemes.push('absence');
    }
    if (mem.subjectKey.includes('pet') || mem.subjectKey.includes('comfort')) {
      candidateThemes.push('affection');
    }
  }

  // Add personality biases
  if (context.personality.mischief >= 60) candidateThemes.push('mischief');
  if (context.personality.playfulness >= 65) candidateThemes.push('play');
  if (context.personality.affectionateness >= 65) candidateThemes.push('affection');

  const { value: chosenTheme, nextState: rngAfterTheme } = randomChoice(rng, candidateThemes);
  rng = rngAfterTheme;

  const themePool = dreamBlueprint.themes[chosenTheme] || dreamBlueprint.themes.general;
  const { value: dreamText, nextState: rngAfterText } = randomChoice(rng, themePool);
  rng = rngAfterText;

  const { value: wakeReaction, nextState: rngAfterWake } = randomChoice(
    rng,
    dreamBlueprint.wakeReactions
  );
  rng = rngAfterWake;

  const dreamMemory: PetMemory = {
    petId: context.petId,
    memoryType: 'dream',
    subjectKey: `dream.${context.now}`,
    formedAt: context.now,
    lastReinforcedAt: context.now,
    lastRecalledAt: null,
    salience: 0.6,
    strength: 0.9,
    valence: 0.5,
    reinforcementCount: 1,
    protected: 0,
    payloadJson: JSON.stringify({
      dreamSummary: dreamText,
      theme: chosenTheme,
      sleepDurationMs: context.sleepDurationMs,
    }),
  };

  return {
    dreamMemory,
    wakeReactionBubble: wakeReaction,
    nextRngState: rng,
  };
}
