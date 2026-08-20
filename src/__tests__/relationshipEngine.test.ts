import { describe, it, expect } from 'vitest';
import {
  applyRelationshipDeltas,
  calculateRelationshipDeltas,
  decayAnnoyance,
  deriveBondStage,
} from '../mind/pure/relationshipEngine';
import { RelationshipState } from '../mind/model/mindState';
import mindBlueprint from '../../brain/species/mind.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';

const mindConfig = mindBlueprint as SpeciesMindConfig;

describe('M003 Pure Relationship Engine', () => {
  it('increases affection from positive care', () => {
    const base: RelationshipState = {
      affection: 50,
      trust: 50,
      familiarity: 10,
      annoyance: 0,
    };

    const deltas = calculateRelationshipDeltas(
      'interaction.feed',
      { satiety: 30 },
      mindConfig.relationshipScaling
    );
    const updated = applyRelationshipDeltas(base, deltas);

    expect(updated.affection).toBeGreaterThan(50);
    expect(updated.familiarity).toBeGreaterThanOrEqual(10);
  });

  it('care when needy has stronger affection impact than when full', () => {
    const hungryDeltas = calculateRelationshipDeltas(
      'interaction.feed',
      { satiety: 20 },
      mindConfig.relationshipScaling
    );
    const fullDeltas = calculateRelationshipDeltas(
      'interaction.feed',
      { satiety: 95 },
      mindConfig.relationshipScaling
    );

    expect(hungryDeltas.affection).toBeGreaterThan(0);
    expect(fullDeltas.affection).toBeLessThan(0);
  });

  it('poke spam increases annoyance and decays over time', () => {
    const base: RelationshipState = {
      affection: 50,
      trust: 50,
      familiarity: 10,
      annoyance: 0,
    };

    const deltas = calculateRelationshipDeltas(
      'interaction.poke',
      { pokeCount: 4 },
      mindConfig.relationshipScaling
    );
    const updated = applyRelationshipDeltas(base, deltas);

    expect(updated.annoyance).toBeGreaterThanOrEqual(16);

    // After 30 minutes (half life = 0.5h), annoyance should decay to ~half
    const decayed = decayAnnoyance(
      updated.annoyance,
      30 * 60 * 1000,
      mindConfig.relationshipScaling.annoyanceHalfLifeHours
    );
    expect(decayed).toBeCloseTo(updated.annoyance / 2, 0);
  });

  it('familiarity does not collapse from temporary annoyance', () => {
    const base: RelationshipState = {
      affection: 50,
      trust: 50,
      familiarity: 45,
      annoyance: 0,
    };

    const deltas = calculateRelationshipDeltas(
      'interaction.poke',
      { pokeCount: 5 },
      mindConfig.relationshipScaling
    );
    const updated = applyRelationshipDeltas(base, deltas);

    expect(updated.annoyance).toBeGreaterThan(0);
    expect(updated.familiarity).toBe(45); // Unchanged / not reduced
  });

  it('derives bond stages according to composite threshold requirements', () => {
    const fresh: RelationshipState = {
      affection: 50,
      trust: 50,
      familiarity: 0,
      annoyance: 0,
    };
    expect(deriveBondStage(fresh, mindConfig.bondStages).id).toBe('new_creature');

    const buddy: RelationshipState = {
      affection: 55,
      trust: 50,
      familiarity: 40,
      annoyance: 0,
    };
    expect(deriveBondStage(buddy, mindConfig.bondStages).id).toBe('buddy');

    // High affection alone without familiarity cannot reach bonded stage
    const unbalanced: RelationshipState = {
      affection: 95,
      trust: 95,
      familiarity: 10,
      annoyance: 0,
    };
    expect(deriveBondStage(unbalanced, mindConfig.bondStages).id).not.toBe('bonded');
  });
});
