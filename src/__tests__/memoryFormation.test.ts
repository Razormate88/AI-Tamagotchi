import { describe, it, expect } from 'vitest';
import { evaluateLifeEventMemory } from '../mind/pure/memoryFormation';
import { PetMemory } from '../mind/model/mindState';
import mindBlueprint from '../../brain/species/mind.json';
import { SpeciesMindConfig } from '../mind/model/mindConfig';

const mindConfig = mindBlueprint as SpeciesMindConfig;

describe('M003 Pure Memory Formation Pipeline', () => {
  it('creates exactly one protected first memory for first feed', () => {
    const existing = new Map<string, PetMemory>();
    const event = {
      petId: 'test-pet',
      eventType: 'interaction.feed',
      occurredAt: 1000,
      importance: 0.3,
      payloadJson: JSON.stringify({ satiety: 60 }),
    };

    const action = evaluateLifeEventMemory(event, existing, mindConfig.memoryTuning);
    expect(action.action).toBe('create');
    expect(action.subjectKey).toBe('first.feed');
    expect(action.memoryType).toBe('first');
    expect(action.protected).toBe(1);
    expect(action.salience).toBeGreaterThanOrEqual(0.7);
  });

  it('second feed does not duplicate first memory and instead creates or reinforces care.feeding', () => {
    const existing = new Map<string, PetMemory>();
    existing.set('first.feed', {
      id: 1,
      petId: 'test-pet',
      memoryType: 'first',
      subjectKey: 'first.feed',
      formedAt: 1000,
      lastReinforcedAt: 1000,
      lastRecalledAt: null,
      salience: 0.85,
      strength: 1.0,
      valence: 1.0,
      reinforcementCount: 1,
      protected: 1,
      payloadJson: '{}',
    });

    const event = {
      petId: 'test-pet',
      eventType: 'interaction.feed',
      occurredAt: 2000,
      importance: 0.3,
      payloadJson: JSON.stringify({ satiety: 80 }),
    };

    const action = evaluateLifeEventMemory(event, existing, mindConfig.memoryTuning);
    expect(action.subjectKey).toBe('care.feeding');
    expect(action.memoryType).toBe('care');
    expect(action.protected).toBe(0);
  });

  it('repeated poking reinforces conflict.poking', () => {
    const existing = new Map<string, PetMemory>();
    existing.set('first.poke', {
      id: 1,
      petId: 'test-pet',
      memoryType: 'first',
      subjectKey: 'first.poke',
      formedAt: 1000,
      lastReinforcedAt: 1000,
      lastRecalledAt: null,
      salience: 0.85,
      strength: 1.0,
      valence: 0.0,
      reinforcementCount: 1,
      protected: 1,
      payloadJson: '{}',
    });

    const event = {
      petId: 'test-pet',
      eventType: 'interaction.poke',
      occurredAt: 3000,
      importance: 0.4,
      payloadJson: JSON.stringify({ pokeCount: 4 }),
    };

    const action = evaluateLifeEventMemory(event, existing, mindConfig.memoryTuning);
    expect(action.subjectKey).toBe('conflict.poking');
    expect(action.memoryType).toBe('conflict');
    expect(action.valence).toBeLessThan(0);
  });

  it('long absence creates high-salience absence memory', () => {
    const existing = new Map<string, PetMemory>();
    const event = {
      petId: 'test-pet',
      eventType: 'owner.returned',
      occurredAt: 50000,
      importance: 0.8,
      payloadJson: JSON.stringify({ absenceHours: 72 }),
    };

    const action = evaluateLifeEventMemory(event, existing, mindConfig.memoryTuning);
    expect(action.subjectKey).toBe('first.very_long_return');
    expect(action.salience).toBeGreaterThanOrEqual(0.85);
  });

  it('short absence under threshold produces no permanent junk memory', () => {
    const existing = new Map<string, PetMemory>();
    const event = {
      petId: 'test-pet',
      eventType: 'owner.returned',
      occurredAt: 50000,
      importance: 0.1,
      payloadJson: JSON.stringify({ absenceHours: 0.5 }),
    };

    const action = evaluateLifeEventMemory(event, existing, mindConfig.memoryTuning);
    expect(action.action).toBe('none');
  });
});
