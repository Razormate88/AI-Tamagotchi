import { describe, it, expect } from 'vitest';
import speciesBlueprint from '../../brain/species/identity.json';
import { SpeciesIdentity } from '../types/pet';

describe('Public Species Brain Seed', () => {
  const species = speciesBlueprint as SpeciesIdentity;

  it('contains valid canonical species identity fields', () => {
    expect(species.schemaVersion).toBe('1.0.0');
    expect(species.speciesId).toBe('gloop');
    expect(species.canonicalName).toBe('Gloop');
    expect(species.description).toContain('desktop companion');
    expect(Array.isArray(species.temperamentTags)).toBe(true);
    expect(species.temperamentTags.length).toBeGreaterThan(0);
  });

  it('defines valid visual scaffolding', () => {
    expect(species.visualScaffolding).toBeDefined();
    expect(species.visualScaffolding.shape).toBe('blob');
    expect(species.visualScaffolding.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(species.visualScaffolding.secondaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
