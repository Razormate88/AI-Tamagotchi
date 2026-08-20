import { MemoryType, PetMemory } from '../model/mindState';
import { MemoryTuningConfig } from '../model/mindConfig';
import { PetLifeEvent } from '../../simulation/model/petState';

export interface EvaluatedMemoryAction {
  action: 'create' | 'reinforce' | 'none';
  subjectKey: string;
  memoryType: MemoryType;
  salience: number;
  strength: number;
  valence: number;
  protected: number;
  payload: Record<string, any>;
}

/**
 * Pure classifier that evaluates incoming life events and determines whether a new memory
 * should be formed or an existing memory reinforced.
 */
export function evaluateLifeEventMemory(
  event: PetLifeEvent,
  existingMemories: Map<string, PetMemory>,
  tuning: MemoryTuningConfig
): EvaluatedMemoryAction {
  let payloadData: Record<string, any> = {};
  try {
    payloadData = JSON.parse(event.payloadJson);
  } catch {
    payloadData = {};
  }

  // 1. Check for "First" memories
  switch (event.eventType) {
    case 'interaction.feed': {
      if (!existingMemories.has('first.feed')) {
        return {
          action: 'create',
          subjectKey: 'first.feed',
          memoryType: 'first',
          salience: tuning.salienceThresholds.first,
          strength: 1.0,
          valence: 1.0,
          protected: 1,
          payload: { initialFeedTime: event.occurredAt },
        };
      }
      // Otherwise, reinforce general care.feeding
      const existing = existingMemories.get('care.feeding');
      const count = (existing ? JSON.parse(existing.payloadJson || '{}').count || existing.reinforcementCount : 1) + 1;
      return {
        action: existing ? 'reinforce' : 'create',
        subjectKey: 'care.feeding',
        memoryType: 'care',
        salience: 0.35,
        strength: 0.9,
        valence: 0.6,
        protected: 0,
        payload: { count },
      };
    }

    case 'interaction.pet': {
      if (!existingMemories.has('first.pet')) {
        return {
          action: 'create',
          subjectKey: 'first.pet',
          memoryType: 'first',
          salience: tuning.salienceThresholds.first,
          strength: 1.0,
          valence: 1.0,
          protected: 1,
          payload: { initialPetTime: event.occurredAt },
        };
      }
      const wasLonely = (payloadData.social ?? 50) < 35;
      if (wasLonely) {
        const existing = existingMemories.get('care.comfort_lonely');
        const count = (existing ? JSON.parse(existing.payloadJson || '{}').count || existing.reinforcementCount : 1) + 1;
        return {
          action: existing ? 'reinforce' : 'create',
          subjectKey: 'care.comfort_lonely',
          memoryType: 'affection',
          salience: 0.6,
          strength: 0.95,
          valence: 0.9,
          protected: 0,
          payload: { count },
        };
      }
      return { action: 'none', subjectKey: '', memoryType: 'care', salience: 0, strength: 0, valence: 0, protected: 0, payload: {} };
    }

    case 'interaction.play': {
      if (!existingMemories.has('first.play')) {
        return {
          action: 'create',
          subjectKey: 'first.play',
          memoryType: 'first',
          salience: tuning.salienceThresholds.first,
          strength: 1.0,
          valence: 1.0,
          protected: 1,
          payload: { initialPlayTime: event.occurredAt },
        };
      }
      return { action: 'none', subjectKey: '', memoryType: 'care', salience: 0, strength: 0, valence: 0, protected: 0, payload: {} };
    }

    case 'interaction.poke': {
      if (!existingMemories.has('first.poke')) {
        return {
          action: 'create',
          subjectKey: 'first.poke',
          memoryType: 'first',
          salience: tuning.salienceThresholds.first,
          strength: 1.0,
          valence: 0.1,
          protected: 1,
          payload: { initialPokeTime: event.occurredAt },
        };
      }
      const pokeCount = payloadData.pokeCount ?? 1;
      if (pokeCount >= 3) {
        const existing = existingMemories.get('conflict.poking');
        const count = (existing ? JSON.parse(existing.payloadJson || '{}').count || existing.reinforcementCount : 1) + 1;
        return {
          action: existing ? 'reinforce' : 'create',
          subjectKey: 'conflict.poking',
          memoryType: 'conflict',
          salience: 0.65,
          strength: 0.95,
          valence: -0.7,
          protected: 0,
          payload: { count },
        };
      }
      return { action: 'none', subjectKey: '', memoryType: 'conflict', salience: 0, strength: 0, valence: 0, protected: 0, payload: {} };
    }

    case 'sleep.started': {
      if (!existingMemories.has('first.sleep')) {
        return {
          action: 'create',
          subjectKey: 'first.sleep',
          memoryType: 'first',
          salience: tuning.salienceThresholds.first,
          strength: 1.0,
          valence: 0.5,
          protected: 1,
          payload: { initialSleepTime: event.occurredAt },
        };
      }
      return { action: 'none', subjectKey: '', memoryType: 'sleep', salience: 0, strength: 0, valence: 0, protected: 0, payload: {} };
    }

    case 'sleep.woke': {
      if (payloadData.source === 'manual_request' && (payloadData.energy ?? 100) < 30) {
        const existing = existingMemories.get('conflict.waking');
        const count = (existing ? JSON.parse(existing.payloadJson || '{}').count || existing.reinforcementCount : 1) + 1;
        return {
          action: existing ? 'reinforce' : 'create',
          subjectKey: 'conflict.waking',
          memoryType: 'conflict',
          salience: 0.7,
          strength: 0.9,
          valence: -0.6,
          protected: 0,
          payload: { count },
        };
      }
      return { action: 'none', subjectKey: '', memoryType: 'sleep', salience: 0, strength: 0, valence: 0, protected: 0, payload: {} };
    }

    case 'owner.returned': {
      const hours = payloadData.absenceHours ?? 0;
      const days = Math.round(hours / 24);

      if (hours >= tuning.salienceThresholds.majorAbsenceHours) {
        if (!existingMemories.has('first.very_long_return')) {
          return {
            action: 'create',
            subjectKey: 'first.very_long_return',
            memoryType: 'first',
            salience: 0.95,
            strength: 1.0,
            valence: 0.8,
            protected: 1,
            payload: { hours: Math.round(hours), days: Math.max(1, days) },
          };
        }

        const existing = existingMemories.get('return.long');
        return {
          action: existing ? 'reinforce' : 'create',
          subjectKey: 'return.long',
          memoryType: 'return',
          salience: 0.8,
          strength: 0.95,
          valence: 0.7,
          protected: 0,
          payload: { hours: Math.round(hours), days: Math.max(1, days) },
        };
      } else if (hours >= tuning.salienceThresholds.moderateAbsenceHours) {
        if (!existingMemories.has('first.long_absence')) {
          return {
            action: 'create',
            subjectKey: 'first.long_absence',
            memoryType: 'first',
            salience: 0.85,
            strength: 1.0,
            valence: 0.4,
            protected: 1,
            payload: { hours: Math.round(hours) },
          };
        }

        const existing = existingMemories.get('absence.long');
        return {
          action: existing ? 'reinforce' : 'create',
          subjectKey: 'absence.long',
          memoryType: 'absence',
          salience: 0.6,
          strength: 0.85,
          valence: 0.3,
          protected: 0,
          payload: { hours: Math.round(hours) },
        };
      }
      return { action: 'none', subjectKey: '', memoryType: 'return', salience: 0, strength: 0, valence: 0, protected: 0, payload: {} };
    }

    case 'mood.changed': {
      if (payloadData.mood === 'grumpy' && !existingMemories.has('first.grumpy')) {
        return {
          action: 'create',
          subjectKey: 'first.grumpy',
          memoryType: 'first',
          salience: tuning.salienceThresholds.first,
          strength: 1.0,
          valence: -0.5,
          protected: 1,
          payload: { reason: payloadData.reason || 'grumpy_mood' },
        };
      }
      return { action: 'none', subjectKey: '', memoryType: 'mood', salience: 0, strength: 0, valence: 0, protected: 0, payload: {} };
    }

    default:
      return { action: 'none', subjectKey: '', memoryType: 'quirk', salience: 0, strength: 0, valence: 0, protected: 0, payload: {} };
  }
}
