import { setPetWindowSize } from './windowControl';
import { PetSizePreset } from '../types/settings';
import { PetSizeConfig } from '../types/desktop';

export const PET_SIZE_PRESETS: Record<PetSizePreset, PetSizeConfig> = {
  tiny: {
    preset: 'tiny',
    label: 'Tiny (140px)',
    width: 140,
    height: 140,
  },
  small: {
    preset: 'small',
    label: 'Small (180px)',
    width: 180,
    height: 180,
  },
  medium: {
    preset: 'medium',
    label: 'Medium (220px)',
    width: 220,
    height: 220,
  },
  large: {
    preset: 'large',
    label: 'Large (300px)',
    width: 300,
    height: 300,
  },
};

export const DEFAULT_PET_SIZE_PRESET: PetSizePreset = 'medium';

/**
 * Resizes the native desktop pet window to match the requested preset.
 */
export async function applyPetSizePreset(preset: PetSizePreset): Promise<void> {
  const config = PET_SIZE_PRESETS[preset];
  if (!config) return;

  await setPetWindowSize(config.width, config.height);
}
