export interface SpeciesDreamsConfig {
  schemaVersion: string;
  speciesId: string;
  themes: {
    food: string[];
    play: string[];
    mischief: string[];
    absence: string[];
    affection: string[];
    lonely: string[];
    general: string[];
    [key: string]: string[];
  };
  wakeReactions: string[];
}
