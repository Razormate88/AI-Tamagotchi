import { describe, it, expect } from 'vitest';
import { selectRecalledMemory } from '../mind/pure/recallEngine';
import { PetMemory } from '../mind/model/mindState';
import mindBlueprint from '../../brain/species/mind.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';

const mindConfig = mindBlueprint as SpeciesMindConfig;

describe('M003 Deterministic Memory Recall Engine', () => {
  it('favors context-relevant strong memory', () => {
    const memories: PetMemory[] = [
      {
        id: 1,
        petId: 'test-pet',
        memoryType: 'care',
        subjectKey: 'care.feeding',
        formedAt: 1000,
        lastReinforcedAt: 1000,
        lastRecalledAt: null,
        salience: 0.5,
        strength: 0.9,
        valence: 0.5,
        reinforcementCount: 5,
        protected: 0,
        payloadJson: '{}',
      },
      {
        id: 2,
        petId: 'test-pet',
        memoryType: 'conflict',
        subjectKey: 'conflict.poking',
        formedAt: 1000,
        lastReinforcedAt: 1000,
        lastRecalledAt: null,
        salience: 0.7,
        strength: 0.95,
        valence: -0.7,
        reinforcementCount: 8,
        protected: 0,
        payloadJson: '{}',
      },
    ];

    const result = selectRecalledMemory(
      memories,
      {
        trigger: 'interaction.poke',
        now: 10000,
        rngState: 42,
      },
      mindConfig.memoryTuning
    );

    expect(result.recalledMemory).toBeDefined();
    expect(result.recalledMemory?.subjectKey).toBe('conflict.poking');
  });

  it('recall cooldown prevents immediate repetition', () => {
    const memories: PetMemory[] = [
      {
        id: 1,
        petId: 'test-pet',
        memoryType: 'conflict',
        subjectKey: 'conflict.poking',
        formedAt: 1000,
        lastReinforcedAt: 1000,
        lastRecalledAt: 5000, // Recalled 10 seconds ago (cooldown is 3 minutes)
        salience: 0.8,
        strength: 0.9,
        valence: -0.6,
        reinforcementCount: 6,
        protected: 0,
        payloadJson: '{}',
      },
    ];

    const result = selectRecalledMemory(
      memories,
      {
        trigger: 'interaction.poke',
        now: 15000,
        rngState: 42,
      },
      mindConfig.memoryTuning
    );

    expect(result.recalledMemory).toBeNull();
  });
});
