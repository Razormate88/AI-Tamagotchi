import { describe, it, expect } from 'vitest';
import identityBlueprint from '../../brain/species/identity.json';
import lifeBlueprint from '../../brain/species/life.json';
import reactionsBlueprint from '../../brain/species/reactions.json';

describe('Public Brain Schema & Content Integrity', () => {
  it('validates identity.json structure and temperament tags', () => {
    expect(identityBlueprint.schemaVersion).toBe('1.0.0');
    expect(identityBlueprint.speciesId).toBe('gloop');
    expect(identityBlueprint.canonicalName).toBe('Gloop');
    expect(Array.isArray(identityBlueprint.temperamentTags)).toBe(true);
    expect(identityBlueprint.temperamentTags).toContain('curious');
    expect(identityBlueprint.temperamentTags).toContain('bouncy');
    expect(identityBlueprint.temperamentTags).toContain('affectionate');
    expect(identityBlueprint.temperamentTags).toContain('spontaneous');
  });

  it('validates life.json configuration and decay parameters', () => {
    expect(lifeBlueprint.schemaVersion).toBe('1.0.0');
    expect(lifeBlueprint.speciesId).toBe('gloop');
    expect(lifeBlueprint.decayRatesAwakePerHour.satiety).toBeGreaterThan(0);
    expect(lifeBlueprint.decayRatesAwakePerHour.energy).toBeGreaterThan(0);
    expect(lifeBlueprint.decayRatesAsleepPerHour.energyRecovery).toBeGreaterThan(0);
    expect(lifeBlueprint.sleepParameters.tiredEnergyThreshold).toBeDefined();
    expect(lifeBlueprint.sleepParameters.restedEnergyThreshold).toBeDefined();
    expect(lifeBlueprint.interactionEffects.feed).toBeDefined();
    expect(lifeBlueprint.interactionEffects.pet).toBeDefined();
    expect(lifeBlueprint.interactionEffects.play).toBeDefined();
    expect(lifeBlueprint.interactionEffects.poke).toBeDefined();
    expect(lifeBlueprint.returnIntervalsMs.shortMs).toBeDefined();
    expect(lifeBlueprint.returnIntervalsMs.mediumMs).toBeDefined();
    expect(lifeBlueprint.returnIntervalsMs.longMs).toBeDefined();
  });

  it('validates reactions.json pools coverage for all required categories', () => {
    expect(reactionsBlueprint.schemaVersion).toBe('1.0.0');
    expect(reactionsBlueprint.speciesId).toBe('gloop');

    const requiredPools = [
      'interaction.feed',
      'interaction.feed_full',
      'interaction.pet',
      'interaction.play',
      'interaction.play_tired',
      'interaction.poke',
      'interaction.poke_repeated',
      'interaction.sleep',
      'interaction.wake',
      'needs.hungry',
      'needs.tired',
      'needs.bored',
      'needs.lonely',
      'activity.daydream',
      'activity.self_play',
      'activity.seek_attention',
      'activity.yawn',
      'return.short',
      'return.medium',
      'return.long',
      'return.very_long',
    ];

    for (const poolKey of requiredPools) {
      const pool = (reactionsBlueprint.pools as Record<string, string[]>)[poolKey];
      expect(pool, `Missing reaction pool: ${poolKey}`).toBeDefined();
      expect(pool.length, `Empty reaction pool: ${poolKey}`).toBeGreaterThan(0);
      for (const line of pool) {
        expect(typeof line).toBe('string');
        expect(line.length).toBeGreaterThan(0);
      }
    }
  });
});
