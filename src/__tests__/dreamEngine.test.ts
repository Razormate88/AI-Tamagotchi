import { describe, it, expect } from 'vitest';
import { evaluateSleepDream } from '../mind/pure/dreamEngine';
import mindBlueprint from '../../brain/species/mind.json';
import dreamsBlueprint from '../../brain/species/dreams.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';
import { SpeciesDreamsConfig } from '../mind/model/dreamTemplates';

const mindConfig = mindBlueprint as SpeciesMindConfig;
const dreamsConfig = dreamsBlueprint as SpeciesDreamsConfig;

describe('M003 Deterministic Sleep Dream Engine', () => {
  it('short sleep under threshold does not produce a dream', () => {
    const result = evaluateSleepDream(
      {
        petId: 'test-pet',
        sleepDurationMs: 5000, // 5 seconds (min is 120s)
        lastDreamAt: 0,
        recentMemories: [],
        personality: mindConfig.personalityBaselines,
        now: 10000,
        rngState: 42,
      },
      mindConfig.dreamTuning,
      dreamsConfig
    );

    expect(result.dreamMemory).toBeNull();
    expect(result.wakeReactionBubble).toBeNull();
  });

  it('qualifying sleep produces a deterministic dream referencing recent themes', () => {
    const result = evaluateSleepDream(
      {
        petId: 'test-pet',
        sleepDurationMs: 150000, // 2.5 minutes
        lastDreamAt: 0,
        recentMemories: [
          {
            id: 1,
            petId: 'test-pet',
            memoryType: 'care',
            subjectKey: 'care.feeding',
            formedAt: 1000,
            lastReinforcedAt: 1000,
            lastRecalledAt: null,
            salience: 0.5,
            strength: 1.0,
            valence: 0.5,
            reinforcementCount: 3,
            protected: 0,
            payloadJson: JSON.stringify({ satiety: 80 }),
          },
        ],
        personality: mindConfig.personalityBaselines,
        now: 200000,
        rngState: 42,
      },
      mindConfig.dreamTuning,
      dreamsConfig
    );

    expect(result.dreamMemory).toBeDefined();
    expect(result.dreamMemory?.memoryType).toBe('dream');
    expect(result.wakeReactionBubble).toBeDefined();

    const payload = JSON.parse(result.dreamMemory?.payloadJson || '{}');
    expect(payload.dreamSummary).toBeDefined();
    expect(typeof payload.dreamSummary).toBe('string');
  });

  it('same seed produces identical dream and wake line', () => {
    const context = {
      petId: 'test-pet',
      sleepDurationMs: 180000,
      lastDreamAt: 0,
      recentMemories: [],
      personality: mindConfig.personalityBaselines,
      now: 300000,
      rngState: 9999,
    };

    const res1 = evaluateSleepDream(context, mindConfig.dreamTuning, dreamsConfig);
    const res2 = evaluateSleepDream(context, mindConfig.dreamTuning, dreamsConfig);

    expect(res1.dreamMemory?.payloadJson).toBe(res2.dreamMemory?.payloadJson);
    expect(res1.wakeReactionBubble).toBe(res2.wakeReactionBubble);
  });
});
