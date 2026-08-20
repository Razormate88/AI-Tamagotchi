export interface SecretDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  reaction: string;
  repeatable: boolean;
}

export interface SpeciesSecretsConfig {
  schemaVersion: string;
  speciesId: string;
  secrets: SecretDefinition[];
}
