import { PetMemory } from '../model/mindState';
import { MemoryTuningConfig } from '../model/mindConfig';
import { randomIntRange } from '../../simulation/engine/rng';

export interface RecallContext {
  trigger: string; // e.g. 'interaction.poke', 'interaction.feed', 'owner.returned', 'sleep.wake', 'mood.lonely'
  pokeCount?: number;
  now: number;
  rngState: number;
}

export interface RecallResult {
  recalledMemory: PetMemory | null;
  nextRngState: number;
}

/**
 * Calculates matching score between a memory and the current interaction trigger context.
 */
function calculateRelevance(memory: PetMemory, trigger: string): number {
  if (trigger.startsWith('interaction.poke')) {
    if (memory.subjectKey === 'conflict.poking') return 1.0;
    if (memory.subjectKey === 'first.poke') return 0.8;
    if (memory.memoryType === 'conflict') return 0.5;
  }

  if (trigger.startsWith('interaction.feed')) {
    if (memory.subjectKey === 'care.feeding') return 0.9;
    if (memory.subjectKey === 'first.feed') return 0.8;
  }

  if (trigger.startsWith('interaction.pet')) {
    if (memory.subjectKey === 'care.comfort_lonely') return 0.9;
    if (memory.subjectKey === 'first.pet') return 0.8;
  }

  if (trigger.startsWith('owner.returned')) {
    if (memory.subjectKey === 'return.long' || memory.subjectKey === 'first.very_long_return') return 1.0;
    if (memory.subjectKey === 'absence.long' || memory.subjectKey === 'first.long_absence') return 0.9;
  }

  if (trigger.startsWith('sleep.wake')) {
    if (memory.memoryType === 'dream') return 1.0;
    if (memory.subjectKey === 'conflict.waking') return 0.8;
    if (memory.subjectKey === 'first.sleep') return 0.6;
  }

  if (trigger.startsWith('mood.lonely')) {
    if (memory.subjectKey === 'care.comfort_lonely') return 0.9;
  }

  return 0.0;
}

/**
 * Ranks memories deterministically and selects 0 or 1 top memory.
 */
export function selectRecalledMemory(
  memories: PetMemory[],
  context: RecallContext,
  tuning: MemoryTuningConfig
): RecallResult {
  let rng = context.rngState;
  const candidates: { memory: PetMemory; score: number }[] = [];

  for (const mem of memories) {
    const relevance = calculateRelevance(mem, context.trigger);
    if (relevance <= 0.2) continue;

    // Check recall cooldown
    if (mem.lastRecalledAt && context.now - mem.lastRecalledAt < tuning.recallCooldownMs) {
      continue;
    }

    const reinforcementBonus = Math.min(0.2, mem.reinforcementCount * 0.03);
    const score = relevance * 0.4 + mem.salience * 0.3 + mem.strength * 0.2 + reinforcementBonus;

    if (score >= 0.45) {
      candidates.push({ memory: mem, score });
    }
  }

  if (candidates.length === 0) {
    return { recalledMemory: null, nextRngState: rng };
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // If top candidate has a dominant score, return it
  if (candidates.length === 1 || candidates[0].score >= candidates[1].score + 0.15) {
    return { recalledMemory: candidates[0].memory, nextRngState: rng };
  }

  // Slight deterministic RNG tiebreaker among top 2 candidates
  const { value: pickIndex, nextState: nextRng } = randomIntRange(rng, 0, 1);
  return {
    recalledMemory: candidates[pickIndex].memory,
    nextRngState: nextRng,
  };
}
