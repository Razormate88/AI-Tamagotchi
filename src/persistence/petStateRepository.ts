import { getDatabase } from './database';
import { PetActivityType, PetSleepState, PetState } from '../simulation/model/petState';

interface PetStateRow {
  pet_id: string;
  satiety: number;
  energy: number;
  fun: number;
  social: number;
  sleep_state: string;
  current_activity: string;
  activity_started_at: number;
  activity_duration_ms: number;
  simulation_updated_at: number;
  last_interaction_at: number;
  last_speech_at: number;
  total_awake_ms: number;
  total_asleep_ms: number;
  rng_state: number;
  revision: number;
}

function mapRowToState(row: PetStateRow): PetState {
  return {
    petId: row.pet_id,
    satiety: row.satiety,
    energy: row.energy,
    fun: row.fun,
    social: row.social,
    sleepState: (row.sleep_state as PetSleepState) || 'awake',
    currentActivity: (row.current_activity as PetActivityType) || 'idle',
    activityStartedAt: row.activity_started_at,
    activityDurationMs: row.activity_duration_ms,
    simulationUpdatedAt: row.simulation_updated_at,
    lastInteractionAt: row.last_interaction_at,
    lastSpeechAt: row.last_speech_at || 0,
    totalAwakeMs: row.total_awake_ms || 0,
    totalAsleepMs: row.total_asleep_ms || 0,
    rngState: row.rng_state,
    revision: row.revision,
  };
}

/**
 * Retrieves the persisted state for a pet, or initializes and stores seed values.
 */
export async function getOrCreatePetState(
  petId: string,
  initialSeedState: PetState
): Promise<{ state: PetState; isNew: boolean }> {
  const db = getDatabase();

  const rows = await db.select<PetStateRow[]>(
    `SELECT
      pet_id, satiety, energy, fun, social,
      sleep_state, current_activity, activity_started_at, activity_duration_ms,
      simulation_updated_at, last_interaction_at, last_speech_at,
      total_awake_ms, total_asleep_ms, rng_state, revision
    FROM pet_state WHERE pet_id = $1`,
    [petId]
  );

  if (rows.length > 0) {
    return {
      state: mapRowToState(rows[0]),
      isNew: false,
    };
  }

  // Insert initial seed state
  await savePetState(initialSeedState);
  return {
    state: initialSeedState,
    isNew: true,
  };
}

/**
 * Persists the current state to SQLite.
 */
export async function savePetState(state: PetState): Promise<void> {
  const db = getDatabase();

  await db.execute(
    `INSERT INTO pet_state (
      pet_id, satiety, energy, fun, social,
      sleep_state, current_activity, activity_started_at, activity_duration_ms,
      simulation_updated_at, last_interaction_at, last_speech_at,
      total_awake_ms, total_asleep_ms, rng_state, revision
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT(pet_id) DO UPDATE SET
      satiety = excluded.satiety,
      energy = excluded.energy,
      fun = excluded.fun,
      social = excluded.social,
      sleep_state = excluded.sleep_state,
      current_activity = excluded.current_activity,
      activity_started_at = excluded.activity_started_at,
      activity_duration_ms = excluded.activity_duration_ms,
      simulation_updated_at = excluded.simulation_updated_at,
      last_interaction_at = excluded.last_interaction_at,
      last_speech_at = excluded.last_speech_at,
      total_awake_ms = excluded.total_awake_ms,
      total_asleep_ms = excluded.total_asleep_ms,
      rng_state = excluded.rng_state,
      revision = excluded.revision`,
    [
      state.petId,
      state.satiety,
      state.energy,
      state.fun,
      state.social,
      state.sleepState,
      state.currentActivity,
      state.activityStartedAt,
      state.activityDurationMs,
      state.simulationUpdatedAt,
      state.lastInteractionAt,
      state.lastSpeechAt,
      state.totalAwakeMs,
      state.totalAsleepMs,
      state.rngState,
      state.revision,
    ]
  );
}
