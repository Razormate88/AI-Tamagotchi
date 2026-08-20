import {
  PetHabit,
  PetMemory,
  PetMindState,
  PetPreference,
  PetUnlock,
} from '../model/mindState';
import { SecretDefinition } from '../model/secretDefinitions';

export interface SecretEvaluationContext {
  petId: string;
  mindState: PetMindState;
  memories: PetMemory[];
  preferences: PetPreference[];
  habits: PetHabit[];
  unlockedKeys: Set<string>;
  now: number;
}

/**
 * Pure evaluator for history-based secret discoveries.
 */
export function evaluateSecretUnlocks(
  context: SecretEvaluationContext,
  secretDefinitions: SecretDefinition[]
): PetUnlock[] {
  const newlyUnlocked: PetUnlock[] = [];

  const hasMemory = (subject: string) => context.memories.some((m) => m.subjectKey === subject);
  const getMemory = (subject: string) => context.memories.find((m) => m.subjectKey === subject);
  const dreamsCount = context.memories.filter((m) => m.memoryType === 'dream').length;

  for (const def of secretDefinitions) {
    if (context.unlockedKeys.has(def.key) && !def.repeatable) {
      continue;
    }

    let isTriggered = false;
    let unlockPayload: Record<string, any> = {};

    switch (def.key) {
      case 'poke_documentation': {
        const pokeConflict = getMemory('conflict.poking');
        if (pokeConflict && pokeConflict.reinforcementCount >= 6) {
          isTriggered = true;
          unlockPayload = { pokesLogged: pokeConflict.reinforcementCount };
        }
        break;
      }

      case 'food_singularity': {
        // Look for multiple feed full refusals in preferences or memory
        const feedPref = context.preferences.find((p) => p.preferenceKey === 'interaction.feed');
        if (feedPref && feedPref.sampleCount >= 6 && feedPref.affinity <= -20) {
          isTriggered = true;
        }
        break;
      }

      case 'old_friend': {
        if (context.mindState.familiarity >= 60 && context.mindState.affection >= 65 && context.mindState.trust >= 65) {
          isTriggered = true;
          unlockPayload = { familiarity: context.mindState.familiarity };
        }
        break;
      }

      case 'you_came_back': {
        const longReturn = getMemory('first.very_long_return') || getMemory('return.long');
        if (longReturn && context.mindState.trust >= 60) {
          isTriggered = true;
        }
        break;
      }

      case 'chaos_enabler': {
        if (context.mindState.mischief >= 58 && context.mindState.playfulness >= 65) {
          isTriggered = true;
        }
        break;
      }

      case 'dreamer': {
        if (dreamsCount >= 3) {
          isTriggered = true;
          unlockPayload = { dreamsCount };
        }
        break;
      }

      case 'creature_of_habit': {
        const hasConfidentHabit = context.habits.some((h) => h.sampleCount >= 4 && h.strength >= 60);
        if (hasConfidentHabit) {
          isTriggered = true;
        }
        break;
      }

      case 'no_personal_space': {
        const petMem = getMemory('first.pet');
        const comfortMem = getMemory('care.comfort_lonely');
        const totalPets = (petMem ? 1 : 0) + (comfortMem?.reinforcementCount || 0);
        const petPref = context.preferences.find((p) => p.preferenceKey === 'interaction.pet');
        if (totalPets >= 10 || (petPref && petPref.sampleCount >= 10)) {
          isTriggered = true;
          unlockPayload = { petCount: totalPets || petPref?.sampleCount };
        }
        break;
      }

      case 'night_owl': {
        const nightHabit = context.habits.find((h) => h.habitKey === 'owner.session.night');
        if (nightHabit && nightHabit.sampleCount >= 3) {
          isTriggered = true;
        }
        break;
      }

      case 'patient_saint': {
        if (context.mindState.patience >= 60 && hasMemory('conflict.poking')) {
          isTriggered = true;
        }
        break;
      }

      default:
        break;
    }

    if (isTriggered) {
      newlyUnlocked.push({
        petId: context.petId,
        unlockKey: def.key,
        unlockedAt: context.now,
        payloadJson: JSON.stringify(unlockPayload),
      });
    }
  }

  return newlyUnlocked;
}
