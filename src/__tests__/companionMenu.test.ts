import { describe, it, expect } from 'vitest';
import { PET_SIZE_PRESETS } from '../desktop/petSizes';
import { DEFAULT_APP_SETTINGS, PetSizePreset } from '../types/settings';

describe('Companion Menu Configuration and Presets', () => {
  it('contains all required size options for M001 menu', () => {
    const sizeKeys: PetSizePreset[] = ['tiny', 'small', 'medium', 'large'];
    sizeKeys.forEach((key) => {
      expect(PET_SIZE_PRESETS[key]).toBeDefined();
      expect(PET_SIZE_PRESETS[key].label).toBeDefined();
      expect(PET_SIZE_PRESETS[key].width).toBeGreaterThanOrEqual(140);
      expect(PET_SIZE_PRESETS[key].height).toBeGreaterThanOrEqual(140);
    });
  });

  it('provides default settings with sane values for menu items', () => {
    expect(DEFAULT_APP_SETTINGS.alwaysOnTop).toBe(false);
    expect(DEFAULT_APP_SETTINGS.autostart).toBe(false);
    expect(DEFAULT_APP_SETTINGS.petSizePreset).toBe('medium');
  });
});
