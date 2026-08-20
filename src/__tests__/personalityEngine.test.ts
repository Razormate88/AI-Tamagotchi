import { describe, it, expect } from 'vitest';
import {
  applyPersonalityDrift,
  calculatePersonalityDeltas,
  getPersonalityActivityModifiers,
} from '../mind/pure/personalityEngine';
import { PersonalityState } from '../mind/model/mindState';
import mindBlueprint from '../../brain/species/mind.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';

const mindConfig = mindBlueprint as SpeciesMindConfig;

describe('M003 Pure Personality Engine', () => {
  it('evolves personality with very small, bounded increments', () => {
    const base: PersonalityState = { ...mindConfig.personalityBaselines };

    const deltas = calculatePersonalityDeltas(
      'interaction.play',
      {},
      mindConfig.personalityDriftRates
    );
    const updated = applyPersonalityDrift(
      base,
      deltas,
      mindConfig.personalityBaselines,
      mindConfig.personalityDriftRates
    );

    // Change should be tiny (< 0.1)
    expect(updated.playfulness).toBeGreaterThan(base.playfulness);
    expect(updated.playfulness - base.playfulness).toBeLessThan(0.1);
  });

  it('enforces maximum drift limits and diminishing returns', () => {
    const baselines = mindConfig.personalityBaselines;
    const maxDrift = mindConfig.personalityDriftRates.maxDriftFromBaseline;

    let current: PersonalityState = { ...baselines };
    // Simulate 1,000 play sessions
    for (let i = 0; i < 1000; i++) {
      current = applyPersonalityDrift(
        current,
        { playfulness: 0.5 },
        baselines,
        mindConfig.personalityDriftRates
      );
    }

    expect(current.playfulness).toBeLessThanOrEqual(baselines.playfulness + maxDrift);
    expect(current.playfulness).toBeLessThanOrEqual(100);
  });

  it('personality modifiers subtly influence autonomous activity scores', () => {
    const baselines = mindConfig.personalityBaselines;
    const highCuriosity: PersonalityState = {
      ...baselines,
      curiosity: baselines.curiosity + 20,
    };

    const mods = getPersonalityActivityModifiers(highCuriosity, baselines);
    expect(mods.inspect_something).toBeGreaterThan(1.0);
    expect(mods.daydream).toBeGreaterThan(1.0);
  });
});
