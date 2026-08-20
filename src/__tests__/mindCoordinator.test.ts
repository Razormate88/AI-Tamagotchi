import { describe, it, expect } from 'vitest';
import { buildMindPresentationSnapshot } from '../mind/presentation/mindPresentation';
import { PetMindState, PetMemory, PetPreference, PetHabit, PetUnlock } from '../mind/model/mindState';
import mindBlueprint from '../../brain/species/mind.json';
import memoriesBlueprint from '../../brain/species/memories.json';
import secretsBlueprint from '../../brain/species/secrets.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';
import { SpeciesMemoriesConfig } from '../mind/model/memoryTemplates';
import { SpeciesSecretsConfig } from '../mind/model/secretDefinitions';

const mindConfig = mindBlueprint as SpeciesMindConfig;
const memoriesConfig = memoriesBlueprint as SpeciesMemoriesConfig;
const secretsConfig = secretsBlueprint as SpeciesSecretsConfig;

describe('M003 Presentation Snapshot Builder', () => {
  it('formats mind presentation snapshot with human-readable descriptions', () => {
    const mindState: PetMindState = {
      petId: 'test-pet',
      affection: 72.4,
      trust: 70.1,
      familiarity: 62.8,
      annoyance: 0,
      curiosity: 76.5,
      playfulness: 72.0,
      affectionateness: 67.2,
      mischief: 46.1,
      independence: 41.0,
      patience: 50.5,
      processedLifeEventId: 45,
      mindUpdatedAt: 100000,
      revision: 3,
    };

    const memories: PetMemory[] = [
      {
        id: 1,
        petId: 'test-pet',
        memoryType: 'first',
        subjectKey: 'first.feed',
        formedAt: 10000,
        lastReinforcedAt: 10000,
        lastRecalledAt: null,
        salience: 0.85,
        strength: 1.0,
        valence: 1.0,
        reinforcementCount: 1,
        protected: 1,
        payloadJson: '{}',
      },
      {
        id: 2,
        petId: 'test-pet',
        memoryType: 'care',
        subjectKey: 'care.feeding',
        formedAt: 20000,
        lastReinforcedAt: 90000,
        lastRecalledAt: null,
        salience: 0.4,
        strength: 0.88,
        valence: 0.6,
        reinforcementCount: 14,
        protected: 0,
        payloadJson: JSON.stringify({ count: 14 }),
      },
    ];

    const preferences: PetPreference[] = [
      {
        petId: 'test-pet',
        preferenceKey: 'interaction.feed',
        affinity: 65,
        confidence: 0.8,
        sampleCount: 8,
        updatedAt: 90000,
      },
    ];

    const habits: PetHabit[] = [
      {
        petId: 'test-pet',
        habitKey: 'owner.session.evening',
        strength: 70,
        sampleCount: 5,
        lastObservedAt: 90000,
        payloadJson: '{}',
      },
    ];

    const unlocks: PetUnlock[] = [
      {
        petId: 'test-pet',
        unlockKey: 'old_friend',
        unlockedAt: 80000,
        payloadJson: '{}',
      },
    ];

    const snapshot = buildMindPresentationSnapshot(
      mindState,
      memories,
      preferences,
      habits,
      unlocks,
      mindConfig,
      memoriesConfig,
      secretsConfig,
      100000
    );

    expect(snapshot.petId).toBe('test-pet');
    expect(snapshot.bond.stageId).toBe('close_friend');
    expect(snapshot.bond.stageName).toBe('Close Friend');
    expect(snapshot.bond.affection).toBe(72);
    expect(snapshot.bond.trust).toBe(70);
    expect(snapshot.bond.familiarity).toBe(63);

    expect(snapshot.personality.curiosity).toBe(77);
    expect(snapshot.personality.playfulness).toBe(72);

    expect(snapshot.preferences.length).toBe(1);
    expect(snapshot.preferences[0].label).toBe('Snacks & Feeding');

    expect(snapshot.memories.length).toBe(2);
    expect(snapshot.memories[0].description).toContain('very first time');
    expect(snapshot.memories[1].description).toContain('14 snacks');

    expect(snapshot.unlocks.length).toBe(1);
    expect(snapshot.unlocks[0].name).toBe('Old Friend');
  });
});
