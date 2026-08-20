export interface SpeciesReactionPack {
  schemaVersion: string;
  speciesId: string;
  pools: Record<string, string[]>;
}
