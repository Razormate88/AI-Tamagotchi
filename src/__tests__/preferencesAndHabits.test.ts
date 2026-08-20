import { describe, it, expect } from 'vitest';
import {
  calculateSampleValence,
  updatePreferenceWithSample,
} from '../mind/pure/preferenceEngine';
import {
  getTimeBucket,
  isHabitConfident,
  recordHabitObservation,
} from '../mind/pure/habitEngine';
import mindBlueprint from '../../brain/species/mind.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';

const mindConfig = mindBlueprint as SpeciesMindConfig;

describe('M003 Preferences & Habit Recognition Engine', () => {
  it('single interaction creates low-confidence preference evidence', () => {
    const valence = calculateSampleValence('interaction.play', { fun: 20, energy: 80 });
    expect(valence).toBeGreaterThan(0);

    const pref = updatePreferenceWithSample(
      null,
      'test-pet',
      'interaction.play',
      valence!,
      1000,
      mindConfig.preferenceTuning
    );

    expect(pref.sampleCount).toBe(1);
    expect(pref.confidence).toBeLessThan(0.3);
    expect(pref.affinity).toBeGreaterThan(0);
  });

  it('multiple consistent samples increase confidence progressively', () => {
    let pref: any = null;
    for (let i = 0; i < 5; i++) {
      pref = updatePreferenceWithSample(
        pref,
        'test-pet',
        'interaction.play',
        80,
        1000 + i * 1000,
        mindConfig.preferenceTuning
      );
    }

    expect(pref.sampleCount).toBe(5);
    expect(pref.confidence).toBe(1.0);
    expect(pref.affinity).toBeGreaterThan(30);
  });

  it('correctly categorizes time of day buckets without external activity inspection', () => {
    // 2026-08-20 08:00:00 -> morning
    const morning = new Date(2026, 7, 20, 8, 0, 0).getTime();
    expect(getTimeBucket(morning)).toBe('morning');

    // 2026-08-20 14:00:00 -> afternoon
    const afternoon = new Date(2026, 7, 20, 14, 0, 0).getTime();
    expect(getTimeBucket(afternoon)).toBe('afternoon');

    // 2026-08-20 19:00:00 -> evening
    const evening = new Date(2026, 7, 20, 19, 0, 0).getTime();
    expect(getTimeBucket(evening)).toBe('evening');

    // 2026-08-20 23:00:00 -> night
    const night = new Date(2026, 7, 20, 23, 0, 0).getTime();
    expect(getTimeBucket(night)).toBe('night');
  });

  it('habit requires sample threshold before being considered confident', () => {
    let habit: any = null;

    // 1 observation
    habit = recordHabitObservation(habit, 'test-pet', 'owner.session.evening', 1000);
    expect(isHabitConfident(habit)).toBe(false);

    // 4 observations
    for (let i = 0; i < 3; i++) {
      habit = recordHabitObservation(habit, 'test-pet', 'owner.session.evening', 2000 + i * 1000);
    }
    expect(isHabitConfident(habit)).toBe(true);
  });
});
