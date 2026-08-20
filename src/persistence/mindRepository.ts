import { getDatabase } from './database';
import {
  PetMindState,
  PetMemory,
  PetPreference,
  PetHabit,
  PetUnlock,
  MemoryType,
} from '../mind/model/mindState';

interface MindStateRow {
  pet_id: string;
  affection: number;
  trust: number;
  familiarity: number;
  annoyance: number;
  curiosity: number;
  playfulness: number;
  affectionateness: number;
  mischief: number;
  independence: number;
  patience: number;
  processed_life_event_id: number;
  mind_updated_at: number;
  revision: number;
}

interface MemoryRow {
  id: number;
  pet_id: string;
  memory_type: string;
  subject_key: string;
  formed_at: number;
  last_reinforced_at: number;
  last_recalled_at: number | null;
  salience: number;
  strength: number;
  valence: number;
  reinforcement_count: number;
  protected: number;
  payload_json: string;
}

interface PreferenceRow {
  pet_id: string;
  preference_key: string;
  affinity: number;
  confidence: number;
  sample_count: number;
  updated_at: number;
}

interface HabitRow {
  pet_id: string;
  habit_key: string;
  strength: number;
  sample_count: number;
  last_observed_at: number;
  payload_json: string;
}

interface UnlockRow {
  pet_id: string;
  unlock_key: string;
  unlocked_at: number;
  payload_json: string;
}

function mapRowToMindState(row: MindStateRow): PetMindState {
  return {
    petId: row.pet_id,
    affection: row.affection,
    trust: row.trust,
    familiarity: row.familiarity,
    annoyance: row.annoyance,
    curiosity: row.curiosity,
    playfulness: row.playfulness,
    affectionateness: row.affectionateness,
    mischief: row.mischief,
    independence: row.independence,
    patience: row.patience,
    processedLifeEventId: row.processed_life_event_id,
    mindUpdatedAt: row.mind_updated_at,
    revision: row.revision,
  };
}

function mapRowToMemory(row: MemoryRow): PetMemory {
  return {
    id: row.id,
    petId: row.pet_id,
    memoryType: row.memory_type as MemoryType,
    subjectKey: row.subject_key,
    formedAt: row.formed_at,
    lastReinforcedAt: row.last_reinforced_at,
    lastRecalledAt: row.last_recalled_at,
    salience: row.salience,
    strength: row.strength,
    valence: row.valence,
    reinforcementCount: row.reinforcement_count,
    protected: row.protected,
    payloadJson: row.payload_json,
  };
}

function mapRowToPreference(row: PreferenceRow): PetPreference {
  return {
    petId: row.pet_id,
    preferenceKey: row.preference_key,
    affinity: row.affinity,
    confidence: row.confidence,
    sampleCount: row.sample_count,
    updatedAt: row.updated_at,
  };
}

function mapRowToHabit(row: HabitRow): PetHabit {
  return {
    petId: row.pet_id,
    habitKey: row.habit_key,
    strength: row.strength,
    sampleCount: row.sample_count,
    lastObservedAt: row.last_observed_at,
    payloadJson: row.payload_json,
  };
}

function mapRowToUnlock(row: UnlockRow): PetUnlock {
  return {
    petId: row.pet_id,
    unlockKey: row.unlock_key,
    unlockedAt: row.unlocked_at,
    payloadJson: row.payload_json,
  };
}

/**
 * Loads the current PetMindState from SQLite.
 */
export async function getPetMindState(petId: string): Promise<PetMindState | null> {
  const db = getDatabase();
  const rows = await db.select<MindStateRow[]>(
    `SELECT * FROM pet_mind_state WHERE pet_id = $1`,
    [petId]
  );
  if (!rows || rows.length === 0) return null;
  return mapRowToMindState(rows[0]);
}

/**
 * Saves or updates PetMindState.
 */
export async function savePetMindState(state: PetMindState): Promise<void> {
  const db = getDatabase();
  await db.execute(
    `INSERT INTO pet_mind_state (
      pet_id, affection, trust, familiarity, annoyance,
      curiosity, playfulness, affectionateness, mischief, independence, patience,
      processed_life_event_id, mind_updated_at, revision
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT(pet_id) DO UPDATE SET
      affection = excluded.affection,
      trust = excluded.trust,
      familiarity = excluded.familiarity,
      annoyance = excluded.annoyance,
      curiosity = excluded.curiosity,
      playfulness = excluded.playfulness,
      affectionateness = excluded.affectionateness,
      mischief = excluded.mischief,
      independence = excluded.independence,
      patience = excluded.patience,
      processed_life_event_id = excluded.processed_life_event_id,
      mind_updated_at = excluded.mind_updated_at,
      revision = excluded.revision`,
    [
      state.petId,
      state.affection,
      state.trust,
      state.familiarity,
      state.annoyance,
      state.curiosity,
      state.playfulness,
      state.affectionateness,
      state.mischief,
      state.independence,
      state.patience,
      state.processedLifeEventId,
      state.mindUpdatedAt,
      state.revision,
    ]
  );
}

/**
 * Inserts a newly formed memory.
 */
export async function insertMemory(memory: PetMemory): Promise<number> {
  const db = getDatabase();
  const res = await db.execute(
    `INSERT INTO pet_memories (
      pet_id, memory_type, subject_key, formed_at, last_reinforced_at,
      last_recalled_at, salience, strength, valence, reinforcement_count,
      protected, payload_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      memory.petId,
      memory.memoryType,
      memory.subjectKey,
      memory.formedAt,
      memory.lastReinforcedAt,
      memory.lastRecalledAt,
      memory.salience,
      memory.strength,
      memory.valence,
      memory.reinforcementCount,
      memory.protected,
      memory.payloadJson,
    ]
  );
  return res.lastInsertId ?? 0;
}

/**
 * Updates an existing memory.
 */
export async function updateMemory(memory: PetMemory): Promise<void> {
  if (!memory.id) return;
  const db = getDatabase();
  await db.execute(
    `UPDATE pet_memories SET
      last_reinforced_at = $1,
      last_recalled_at = $2,
      salience = $3,
      strength = $4,
      valence = $5,
      reinforcement_count = $6,
      protected = $7,
      payload_json = $8
    WHERE id = $9 AND pet_id = $10`,
    [
      memory.lastReinforcedAt,
      memory.lastRecalledAt,
      memory.salience,
      memory.strength,
      memory.valence,
      memory.reinforcementCount,
      memory.protected,
      memory.payloadJson,
      memory.id,
      memory.petId,
    ]
  );
}

/**
 * Deletes a specific memory by ID (user Forget action).
 */
export async function deleteMemory(petId: string, memoryId: number): Promise<void> {
  const db = getDatabase();
  await db.execute(`DELETE FROM pet_memories WHERE id = $1 AND pet_id = $2`, [
    memoryId,
    petId,
  ]);
}

/**
 * Loads all active memories for a pet.
 */
export async function getMemoriesForPet(
  petId: string,
  limit: number = 300
): Promise<PetMemory[]> {
  const db = getDatabase();
  const rows = await db.select<MemoryRow[]>(
    `SELECT * FROM pet_memories WHERE pet_id = $1 ORDER BY formed_at DESC LIMIT $2`,
    [petId, limit]
  );
  return rows.map(mapRowToMemory);
}

/**
 * Finds memory by unique subjectKey.
 */
export async function getMemoryBySubjectKey(
  petId: string,
  subjectKey: string
): Promise<PetMemory | null> {
  const db = getDatabase();
  const rows = await db.select<MemoryRow[]>(
    `SELECT * FROM pet_memories WHERE pet_id = $1 AND subject_key = $2 LIMIT 1`,
    [petId, subjectKey]
  );
  if (!rows || rows.length === 0) return null;
  return mapRowToMemory(rows[0]);
}

/**
 * Deletes multiple memories by IDs.
 */
export async function deleteMemoriesByIds(petId: string, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = getDatabase();
  for (const id of ids) {
    await db.execute(`DELETE FROM pet_memories WHERE id = $1 AND pet_id = $2`, [id, petId]);
  }
}

/**
 * Loads all preferences for a pet.
 */
export async function getPreferences(petId: string): Promise<PetPreference[]> {
  const db = getDatabase();
  const rows = await db.select<PreferenceRow[]>(
    `SELECT * FROM pet_preferences WHERE pet_id = $1`,
    [petId]
  );
  return rows.map(mapRowToPreference);
}

/**
 * Saves or updates a preference.
 */
export async function savePreference(pref: PetPreference): Promise<void> {
  const db = getDatabase();
  await db.execute(
    `INSERT INTO pet_preferences (pet_id, preference_key, affinity, confidence, sample_count, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(pet_id, preference_key) DO UPDATE SET
       affinity = excluded.affinity,
       confidence = excluded.confidence,
       sample_count = excluded.sample_count,
       updated_at = excluded.updated_at`,
    [pref.petId, pref.preferenceKey, pref.affinity, pref.confidence, pref.sampleCount, pref.updatedAt]
  );
}

/**
 * Loads all learned habits for a pet.
 */
export async function getHabits(petId: string): Promise<PetHabit[]> {
  const db = getDatabase();
  const rows = await db.select<HabitRow[]>(
    `SELECT * FROM pet_habits WHERE pet_id = $1`,
    [petId]
  );
  return rows.map(mapRowToHabit);
}

/**
 * Saves or updates a habit.
 */
export async function saveHabit(habit: PetHabit): Promise<void> {
  const db = getDatabase();
  await db.execute(
    `INSERT INTO pet_habits (pet_id, habit_key, strength, sample_count, last_observed_at, payload_json)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(pet_id, habit_key) DO UPDATE SET
       strength = excluded.strength,
       sample_count = excluded.sample_count,
       last_observed_at = excluded.last_observed_at,
       payload_json = excluded.payload_json`,
    [habit.petId, habit.habitKey, habit.strength, habit.sampleCount, habit.lastObservedAt, habit.payloadJson]
  );
}

/**
 * Loads all unlocked secrets for a pet.
 */
export async function getUnlocks(petId: string): Promise<PetUnlock[]> {
  const db = getDatabase();
  const rows = await db.select<UnlockRow[]>(
    `SELECT * FROM pet_unlocks WHERE pet_id = $1`,
    [petId]
  );
  return rows.map(mapRowToUnlock);
}

/**
 * Saves a newly unlocked secret.
 */
export async function saveUnlock(unlock: PetUnlock): Promise<void> {
  const db = getDatabase();
  await db.execute(
    `INSERT INTO pet_unlocks (pet_id, unlock_key, unlocked_at, payload_json)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(pet_id, unlock_key) DO UPDATE SET
       unlocked_at = excluded.unlocked_at,
       payload_json = excluded.payload_json`,
    [unlock.petId, unlock.unlockKey, unlock.unlockedAt, unlock.payloadJson]
  );
}

/**
 * Resets all M003 learned mind data while preserving pet profile and M002 state.
 * Sets processed_life_event_id to currentMaxEventId so old historical events are not reprocessed.
 */
export async function resetMindData(
  petId: string,
  baselineState: PetMindState,
  currentMaxEventId: number
): Promise<void> {
  const db = getDatabase();
  await db.execute(`DELETE FROM pet_memories WHERE pet_id = $1`, [petId]);
  await db.execute(`DELETE FROM pet_preferences WHERE pet_id = $1`, [petId]);
  await db.execute(`DELETE FROM pet_habits WHERE pet_id = $1`, [petId]);
  await db.execute(`DELETE FROM pet_unlocks WHERE pet_id = $1`, [petId]);

  const freshState: PetMindState = {
    ...baselineState,
    processedLifeEventId: currentMaxEventId,
    mindUpdatedAt: Date.now(),
    revision: baselineState.revision + 1,
  };
  await savePetMindState(freshState);
}
