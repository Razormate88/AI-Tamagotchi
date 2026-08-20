import { describe, it, expect } from 'vitest';
import {
  calculateDecayedMemory,
  identifyPrunableMemories,
} from '../mind/pure/memoryDecay';
import { PetMemory } from '../mind/model/mindState';
import mindBlueprint from '../../brain/species/mind.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';

const mindConfig = mindBlueprint as SpeciesMindConfig;

describe('M003 Memory Strength Decay & Bounded Pruning', () => {
  it('decays memory strength analytically by elapsed wall-clock time', () => {
    const memory: PetMemory = {
      id: 1,
      petId: 'test-pet',
      memoryType: 'care',
      subjectKey: 'care.feeding',
      formedAt: 0,
      lastReinforcedAt: 0,
      lastRecalledAt: null,
      salience: 0.3, // mundane half life: 2 days
      strength: 1.0,
      valence: 0.5,
      reinforcementCount: 1,
      protected: 0,
      payloadJson: '{}',
    };

    const twoDaysMs = 2 * 24 * 3600 * 1000;
    const decayed = calculateDecayedMemory(memory, twoDaysMs, mindConfig.memoryTuning);

    // After 1 half life (2 days), strength should be ~0.5
    expect(decayed.strength).toBeCloseTo(0.5, 1);

    const fourDaysMs = 4 * 24 * 3600 * 1000;
    const decayedFurther = calculateDecayedMemory(memory, fourDaysMs, mindConfig.memoryTuning);
    expect(decayedFurther.strength).toBeCloseTo(0.25, 1);
  });

  it('protected memories survive ordinary decay and maintain strength baseline', () => {
    const memory: PetMemory = {
      id: 1,
      petId: 'test-pet',
      memoryType: 'first',
      subjectKey: 'first.feed',
      formedAt: 0,
      lastReinforcedAt: 0,
      lastRecalledAt: null,
      salience: 0.9,
      strength: 1.0,
      valence: 1.0,
      reinforcementCount: 1,
      protected: 1,
      payloadJson: '{}',
    };

    const hundredDaysMs = 100 * 24 * 3600 * 1000;
    const decayed = calculateDecayedMemory(memory, hundredDaysMs, mindConfig.memoryTuning);
    expect(decayed.strength).toBeGreaterThanOrEqual(0.7);
  });

  it('identifies weak old memories as prunable candidates while preserving protected ones', () => {
    const memories: PetMemory[] = [
      {
        id: 1,
        petId: 'test-pet',
        memoryType: 'first',
        subjectKey: 'first.feed',
        formedAt: 0,
        lastReinforcedAt: 0,
        lastRecalledAt: null,
        salience: 0.9,
        strength: 0.05,
        valence: 1.0,
        reinforcementCount: 1,
        protected: 1, // protected!
        payloadJson: '{}',
      },
      {
        id: 2,
        petId: 'test-pet',
        memoryType: 'care',
        subjectKey: 'care.idle',
        formedAt: 0,
        lastReinforcedAt: 0,
        lastRecalledAt: null,
        salience: 0.2,
        strength: 0.04, // below prune threshold (0.08)
        valence: 0.0,
        reinforcementCount: 1,
        protected: 0,
        payloadJson: '{}',
      },
    ];

    const prunable = identifyPrunableMemories(memories, mindConfig.memoryTuning);
    expect(prunable).toContain(2);
    expect(prunable).not.toContain(1);
  });
});
