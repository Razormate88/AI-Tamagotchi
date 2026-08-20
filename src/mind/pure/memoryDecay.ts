import { PetMemory } from '../model/mindState';
import { MemoryTuningConfig } from '../model/mindConfig';

/**
 * Calculates decayed strength for a single memory analytically based on elapsed wall-clock time.
 */
export function calculateDecayedMemory(
  memory: PetMemory,
  now: number,
  tuning: MemoryTuningConfig
): PetMemory {
  // Protected memories do not decay past a safe baseline
  if (memory.protected === 1) {
    return {
      ...memory,
      strength: Math.max(0.7, memory.strength),
    };
  }

  const elapsedDays = Math.max(0, (now - memory.lastReinforcedAt) / 86400000);
  let halfLifeDays = tuning.decayHalfLifeDays.mundane;

  if (memory.salience >= 0.7) {
    halfLifeDays = tuning.decayHalfLifeDays.major;
  } else if (memory.salience >= 0.4 || memory.reinforcementCount > 1) {
    halfLifeDays = tuning.decayHalfLifeDays.moderate;
  }

  const decayedStrength = memory.strength * Math.pow(0.5, elapsedDays / halfLifeDays);

  return {
    ...memory,
    strength: Math.round(decayedStrength * 1000) / 1000,
  };
}

/**
 * Identifies memory IDs that should be pruned to keep the database bounded.
 */
export function identifyPrunableMemories(
  memories: PetMemory[],
  tuning: MemoryTuningConfig
): number[] {
  const prunableIds: number[] = [];
  const nonProtected = memories.filter((m) => m.protected === 0 && m.id !== undefined);

  // 1. Weak memories below the prune threshold
  for (const mem of nonProtected) {
    if (mem.strength < tuning.pruneThresholdStrength && mem.salience < 0.6) {
      prunableIds.push(mem.id!);
    }
  }

  // 2. Bound enforcement: if active non-protected memories exceed maxDurableMemories
  const remaining = nonProtected.filter((m) => !prunableIds.includes(m.id!));
  if (remaining.length > tuning.maxDurableMemories) {
    // Sort by lowest strength and salience
    remaining.sort((a, b) => a.strength * a.salience - b.strength * b.salience);
    const excessCount = remaining.length - tuning.maxDurableMemories;
    for (let i = 0; i < excessCount; i++) {
      prunableIds.push(remaining[i].id!);
    }
  }

  return prunableIds;
}
