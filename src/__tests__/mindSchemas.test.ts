import { describe, it, expect } from 'vitest';
import mindBlueprint from '../../brain/species/mind.json';
import memoriesBlueprint from '../../brain/species/memories.json';
import dreamsBlueprint from '../../brain/species/dreams.json';
import secretsBlueprint from '../../brain/species/secrets.json';

describe('M003 Public Species Mind Schemas & Blueprints', () => {
  it('validates mind.json baselines, drift rates, and bond stages', () => {
    expect(mindBlueprint.schemaVersion).toBe('1.0.0');
    expect(mindBlueprint.speciesId).toBe('gloop');

    // Baselines
    expect(mindBlueprint.relationshipBaselines.affection).toBe(50);
    expect(mindBlueprint.relationshipBaselines.trust).toBe(50);
    expect(mindBlueprint.relationshipBaselines.familiarity).toBe(0);
    expect(mindBlueprint.relationshipBaselines.annoyance).toBe(0);

    expect(mindBlueprint.personalityBaselines.curiosity).toBe(75);
    expect(mindBlueprint.personalityBaselines.playfulness).toBe(70);
    expect(mindBlueprint.personalityBaselines.affectionateness).toBe(65);
    expect(mindBlueprint.personalityBaselines.mischief).toBe(45);
    expect(mindBlueprint.personalityBaselines.independence).toBe(40);
    expect(mindBlueprint.personalityBaselines.patience).toBe(50);

    // Bond Stages
    expect(Array.isArray(mindBlueprint.bondStages)).toBe(true);
    expect(mindBlueprint.bondStages.length).toBeGreaterThanOrEqual(6);
    expect(mindBlueprint.bondStages[0].id).toBe('new_creature');
    expect(mindBlueprint.bondStages[mindBlueprint.bondStages.length - 1].id).toBe('bonded');
  });

  it('validates memories.json template mapping', () => {
    expect(memoriesBlueprint.schemaVersion).toBe('1.0.0');
    expect(memoriesBlueprint.speciesId).toBe('gloop');
    expect(memoriesBlueprint.templates['first.feed']).toBeDefined();
    expect(memoriesBlueprint.templates['first.pet']).toBeDefined();
    expect(memoriesBlueprint.templates['first.play']).toBeDefined();
    expect(memoriesBlueprint.templates['first.poke']).toBeDefined();
    expect(memoriesBlueprint.templates['care.feeding']).toBeDefined();
    expect(memoriesBlueprint.templates['conflict.poking']).toBeDefined();
    expect(memoriesBlueprint.templates['dream.recollection']).toBeDefined();
  });

  it('validates dreams.json themes and wake reaction lines', () => {
    expect(dreamsBlueprint.schemaVersion).toBe('1.0.0');
    expect(dreamsBlueprint.speciesId).toBe('gloop');
    expect(Array.isArray(dreamsBlueprint.themes.food)).toBe(true);
    expect(dreamsBlueprint.themes.food.length).toBeGreaterThan(0);
    expect(Array.isArray(dreamsBlueprint.themes.play)).toBe(true);
    expect(Array.isArray(dreamsBlueprint.themes.mischief)).toBe(true);
    expect(Array.isArray(dreamsBlueprint.themes.absence)).toBe(true);
    expect(Array.isArray(dreamsBlueprint.themes.affection)).toBe(true);
    expect(Array.isArray(dreamsBlueprint.themes.general)).toBe(true);
    expect(Array.isArray(dreamsBlueprint.wakeReactions)).toBe(true);
    expect(dreamsBlueprint.wakeReactions.length).toBeGreaterThan(0);
  });

  it('validates secrets.json catalog has 8-12 unique definitions', () => {
    expect(secretsBlueprint.schemaVersion).toBe('1.0.0');
    expect(secretsBlueprint.speciesId).toBe('gloop');
    expect(Array.isArray(secretsBlueprint.secrets)).toBe(true);
    expect(secretsBlueprint.secrets.length).toBeGreaterThanOrEqual(8);
    expect(secretsBlueprint.secrets.length).toBeLessThanOrEqual(12);

    const keys = new Set(secretsBlueprint.secrets.map((s: any) => s.key));
    expect(keys.size).toBe(secretsBlueprint.secrets.length);
    expect(keys.has('poke_documentation')).toBe(true);
    expect(keys.has('food_singularity')).toBe(true);
    expect(keys.has('old_friend')).toBe(true);
    expect(keys.has('you_came_back')).toBe(true);
    expect(keys.has('dreamer')).toBe(true);
  });
});
