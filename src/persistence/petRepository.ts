import { getDatabase } from './database';
import { PetProfile, SpeciesIdentity } from '../types/pet';

const PRIMARY_PET_ID = 'default-pet';

interface PetProfileRow {
  id: string;
  species_id: string;
  name: string;
  created_at: number;
  last_seen_at: number;
}

function mapRowToProfile(row: PetProfileRow): PetProfile {
  return {
    id: row.id,
    speciesId: row.species_id,
    name: row.name,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

/**
 * Retrieves the existing primary pet profile or creates a new one seeded from the public species identity.
 */
export async function getOrCreatePrimaryPet(species: SpeciesIdentity): Promise<PetProfile> {
  const db = getDatabase();

  const rows = await db.select<PetProfileRow[]>(
    'SELECT id, species_id, name, created_at, last_seen_at FROM pet_profile WHERE id = $1',
    [PRIMARY_PET_ID]
  );

  const now = Date.now();

  if (rows.length > 0) {
    const existing = rows[0];
    // Update last seen timestamp on each session start
    await db.execute('UPDATE pet_profile SET last_seen_at = $1 WHERE id = $2', [now, PRIMARY_PET_ID]);
    return {
      ...mapRowToProfile(existing),
      lastSeenAt: now,
    };
  }

  // Create new pet profile initialized from the public species brain
  const initialProfile: PetProfile = {
    id: PRIMARY_PET_ID,
    speciesId: species.speciesId,
    name: species.canonicalName,
    createdAt: now,
    lastSeenAt: now,
  };

  await db.execute(
    'INSERT INTO pet_profile (id, species_id, name, created_at, last_seen_at) VALUES ($1, $2, $3, $4, $5)',
    [
      initialProfile.id,
      initialProfile.speciesId,
      initialProfile.name,
      initialProfile.createdAt,
      initialProfile.lastSeenAt,
    ]
  );

  return initialProfile;
}

/**
 * Updates the last seen timestamp for the active pet.
 */
export async function updatePetLastSeen(id: string): Promise<void> {
  const db = getDatabase();
  await db.execute('UPDATE pet_profile SET last_seen_at = $1 WHERE id = $2', [Date.now(), id]);
}

/**
 * Renames the companion instance.
 */
export async function updatePetName(id: string, name: string): Promise<void> {
  const db = getDatabase();
  await db.execute('UPDATE pet_profile SET name = $1 WHERE id = $2', [name.trim(), id]);
}
