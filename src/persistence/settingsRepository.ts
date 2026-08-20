import { getDatabase } from './database';

interface SettingRow {
  key: string;
  value: string;
  updated_at: number;
}

/**
 * Retrieves a typed setting value from SQLite by key, falling back to a default value if missing.
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = getDatabase();
  const rows = await db.select<SettingRow[]>(
    'SELECT key, value, updated_at FROM app_settings WHERE key = $1',
    [key]
  );

  if (rows.length === 0) {
    return defaultValue;
  }

  try {
    return JSON.parse(rows[0].value) as T;
  } catch (err) {
    console.warn(`Failed to parse setting JSON for key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Upserts a typed setting value into SQLite.
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = getDatabase();
  const serialized = JSON.stringify(value);
  const now = Date.now();

  await db.execute(
    `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `,
    [key, serialized, now]
  );
}
