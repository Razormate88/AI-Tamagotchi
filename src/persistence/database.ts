import Database from '@tauri-apps/plugin-sql';

const DB_PATH = 'sqlite:tamagotchi.db';
let dbInstance: Database | null = null;

const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_meta (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pet_profile (
        id TEXT PRIMARY KEY,
        species_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS pet_state (
        pet_id TEXT PRIMARY KEY,
        satiety REAL NOT NULL,
        energy REAL NOT NULL,
        fun REAL NOT NULL,
        social REAL NOT NULL,
        sleep_state TEXT NOT NULL,
        current_activity TEXT NOT NULL,
        activity_started_at INTEGER NOT NULL,
        activity_duration_ms INTEGER NOT NULL,
        simulation_updated_at INTEGER NOT NULL,
        last_interaction_at INTEGER NOT NULL,
        last_speech_at INTEGER NOT NULL,
        total_awake_ms INTEGER NOT NULL,
        total_asleep_ms INTEGER NOT NULL,
        rng_state INTEGER NOT NULL,
        revision INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pet_life_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        occurred_at INTEGER NOT NULL,
        importance REAL NOT NULL,
        payload_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_life_events_pet_time ON pet_life_events (pet_id, occurred_at);
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS pet_mind_state (
        pet_id TEXT PRIMARY KEY,
        affection REAL NOT NULL,
        trust REAL NOT NULL,
        familiarity REAL NOT NULL,
        annoyance REAL NOT NULL,
        curiosity REAL NOT NULL,
        playfulness REAL NOT NULL,
        affectionateness REAL NOT NULL,
        mischief REAL NOT NULL,
        independence REAL NOT NULL,
        patience REAL NOT NULL,
        processed_life_event_id INTEGER NOT NULL,
        mind_updated_at INTEGER NOT NULL,
        revision INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pet_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id TEXT NOT NULL,
        memory_type TEXT NOT NULL,
        subject_key TEXT NOT NULL,
        formed_at INTEGER NOT NULL,
        last_reinforced_at INTEGER NOT NULL,
        last_recalled_at INTEGER,
        salience REAL NOT NULL,
        strength REAL NOT NULL,
        valence REAL NOT NULL,
        reinforcement_count INTEGER NOT NULL,
        protected INTEGER NOT NULL DEFAULT 0,
        payload_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memories_pet_formed ON pet_memories (pet_id, formed_at);
      CREATE INDEX IF NOT EXISTS idx_memories_pet_salience ON pet_memories (pet_id, salience);
      CREATE INDEX IF NOT EXISTS idx_memories_pet_subject ON pet_memories (pet_id, subject_key);

      CREATE TABLE IF NOT EXISTS pet_preferences (
        pet_id TEXT NOT NULL,
        preference_key TEXT NOT NULL,
        affinity REAL NOT NULL,
        confidence REAL NOT NULL,
        sample_count INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (pet_id, preference_key)
      );

      CREATE TABLE IF NOT EXISTS pet_habits (
        pet_id TEXT NOT NULL,
        habit_key TEXT NOT NULL,
        strength REAL NOT NULL,
        sample_count INTEGER NOT NULL,
        last_observed_at INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY (pet_id, habit_key)
      );

      CREATE TABLE IF NOT EXISTS pet_unlocks (
        pet_id TEXT NOT NULL,
        unlock_key TEXT NOT NULL,
        unlocked_at INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY (pet_id, unlock_key)
      );
    `,
  },
];

/**
 * Initializes SQLite connection and runs all pending schema migrations.
 */
export async function initializeDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const db = await Database.load(DB_PATH);

    // Initial schema meta check table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS schema_meta (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `);

    // Fetch applied migrations
    const appliedRows = await db.select<{ version: number }[]>(
      'SELECT version FROM schema_meta ORDER BY version ASC'
    );
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    // Run unapplied migrations sequentially
    for (const migration of MIGRATIONS) {
      if (!appliedVersions.has(migration.version)) {
        // Execute migration statements
        const statements = migration.sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          await db.execute(statement);
        }

        await db.execute(
          'INSERT INTO schema_meta (version, applied_at) VALUES ($1, $2)',
          [migration.version, Date.now()]
        );
      }
    }

    dbInstance = db;
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Gets the active database instance.
 */
export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}
