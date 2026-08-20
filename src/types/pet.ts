/**
 * Represents the persistent local profile of a companion instance.
 * Stored in SQLite (never committed to Git).
 */
export interface PetProfile {
  id: string;
  speciesId: string;
  name: string;
  createdAt: number;
  lastSeenAt: number;
}

/**
 * Public, version-controlled species blueprint.
 * Defined in brain/species/identity.json.
 */
export interface SpeciesIdentity {
  schemaVersion: string;
  speciesId: string;
  canonicalName: string;
  description: string;
  temperamentTags: string[];
  visualScaffolding: {
    shape: 'blob' | 'amorphous' | 'sprite' | string;
    primaryColor: string;
    secondaryColor: string;
    eyeColor?: string;
  };
}
