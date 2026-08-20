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
