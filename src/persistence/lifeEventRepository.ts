import { getDatabase } from './database';
import { PetLifeEvent } from '../simulation/model/petState';

interface LifeEventRow {
  id: number;
  pet_id: string;
  event_type: string;
  occurred_at: number;
  importance: number;
  payload_json: string;
}

function mapRowToEvent(row: LifeEventRow): PetLifeEvent {
  return {
    id: row.id,
    petId: row.pet_id,
    eventType: row.event_type,
    occurredAt: row.occurred_at,
    importance: row.importance,
    payloadJson: row.payload_json,
  };
}

/**
 * Inserts a single life event into the local private timeline.
 */
export async function recordLifeEvent(event: PetLifeEvent): Promise<void> {
  const db = getDatabase();
  await db.execute(
    `INSERT INTO pet_life_events (pet_id, event_type, occurred_at, importance, payload_json)
     VALUES ($1, $2, $3, $4, $5)`,
    [event.petId, event.eventType, event.occurredAt, event.importance, event.payloadJson]
  );
}

/**
 * Inserts a batch of life events sequentially.
 */
export async function recordLifeEvents(events: PetLifeEvent[]): Promise<void> {
  if (events.length === 0) return;
  const db = getDatabase();
  for (const ev of events) {
    await db.execute(
      `INSERT INTO pet_life_events (pet_id, event_type, occurred_at, importance, payload_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [ev.petId, ev.eventType, ev.occurredAt, ev.importance, ev.payloadJson]
    );
  }
}

/**
 * Retrieves the most recent life events for a pet.
 */
export async function getRecentLifeEvents(
  petId: string,
  limit: number = 50
): Promise<PetLifeEvent[]> {
  const db = getDatabase();
  const rows = await db.select<LifeEventRow[]>(
    `SELECT id, pet_id, event_type, occurred_at, importance, payload_json
     FROM pet_life_events
     WHERE pet_id = $1
     ORDER BY occurred_at DESC
     LIMIT $2`,
    [petId, limit]
  );
  return rows.map(mapRowToEvent);
}

/**
 * Prunes older low-importance events to enforce the bound growth policy.
 * Preserves high importance (importance >= 0.7) events.
 */
export async function pruneLifeEvents(
  petId: string,
  maxLowPriorityEvents: number = 2000
): Promise<void> {
  const db = getDatabase();
  await db.execute(
    `DELETE FROM pet_life_events
     WHERE pet_id = $1
       AND importance < 0.7
       AND id NOT IN (
         SELECT id FROM pet_life_events
         WHERE pet_id = $1 AND importance < 0.7
         ORDER BY occurred_at DESC
         LIMIT $2
       )`,
    [petId, maxLowPriorityEvents]
  );
}
