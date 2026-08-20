import { describe, it, expect } from 'vitest';
import { evaluateSecretUnlocks } from '../mind/pure/secretEngine';
import { PetMindState } from '../mind/model/mindState';
import secretsBlueprint from '../../brain/species/secrets.json';
import mindBlueprint from '../../brain/species/mind.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';
import { SpeciesSecretsConfig } from '../mind/model/secretDefinitions';

const mindConfig = mindBlueprint as SpeciesMindConfig;
const secretsConfig = secretsBlueprint as SpeciesSecretsConfig;

describe('M003 History-Based Secret Discoveries Engine', () => {
  const baseMindState: PetMindState = {
    petId: 'test-pet',
    affection: mindConfig.relationshipBaselines.affection,
    trust: mindConfig.relationshipBaselines.trust,
    familiarity: mindConfig.relationshipBaselines.familiarity,
    annoyance: mindConfig.relationshipBaselines.annoyance,
    curiosity: mindConfig.personalityBaselines.curiosity,
    playfulness: mindConfig.personalityBaselines.playfulness,
    affectionateness: mindConfig.personalityBaselines.affectionateness,
    mischief: mindConfig.personalityBaselines.mischief,
    independence: mindConfig.personalityBaselines.independence,
    patience: mindConfig.personalityBaselines.patience,
    processedLifeEventId: 0,
    mindUpdatedAt: 1000,
    revision: 1,
  };

  it('unlocks poke_documentation when poke conflict reaches reinforcement threshold', () => {
    const context = {
      petId: 'test-pet',
      mindState: baseMindState,
      memories: [
        {
          id: 1,
          petId: 'test-pet',
          memoryType: 'conflict' as const,
          subjectKey: 'conflict.poking',
          formedAt: 1000,
          lastReinforcedAt: 1000,
          lastRecalledAt: null,
          salience: 0.7,
          strength: 1.0,
          valence: -0.7,
          reinforcementCount: 7,
          protected: 0,
          payloadJson: '{}',
        },
      ],
      preferences: [],
      habits: [],
      unlockedKeys: new Set<string>(),
      now: 2000,
    };

    const unlocked = evaluateSecretUnlocks(context, secretsConfig.secrets);
    expect(unlocked.some((u) => u.unlockKey === 'poke_documentation')).toBe(true);
  });

  it('does not re-unlock an already unlocked non-repeatable secret', () => {
    const context = {
      petId: 'test-pet',
      mindState: baseMindState,
      memories: [
        {
          id: 1,
          petId: 'test-pet',
          memoryType: 'conflict' as const,
          subjectKey: 'conflict.poking',
          formedAt: 1000,
          lastReinforcedAt: 1000,
          lastRecalledAt: null,
          salience: 0.7,
          strength: 1.0,
          valence: -0.7,
          reinforcementCount: 7,
          protected: 0,
          payloadJson: '{}',
        },
      ],
      preferences: [],
      habits: [],
      unlockedKeys: new Set<string>(['poke_documentation']),
      now: 3000,
    };

    const unlocked = evaluateSecretUnlocks(context, secretsConfig.secrets);
    expect(unlocked.length).toBe(0);
  });

  it('unrelated state does not trigger secrets prematurely', () => {
    const context = {
      petId: 'test-pet',
      mindState: baseMindState,
      memories: [],
      preferences: [],
      habits: [],
      unlockedKeys: new Set<string>(),
      now: 1000,
    };

    const unlocked = evaluateSecretUnlocks(context, secretsConfig.secrets);
    expect(unlocked.length).toBe(0);
  });
});
