export type PetSizePreset = 'tiny' | 'small' | 'medium' | 'large';

export interface AppSettings {
  alwaysOnTop: boolean;
  autostart: boolean;
  petSizePreset: PetSizePreset;
  soundEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  alwaysOnTop: false,
  autostart: false,
  petSizePreset: 'medium',
  soundEnabled: true,
};
