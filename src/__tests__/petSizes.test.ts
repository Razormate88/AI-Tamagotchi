import { describe, it, expect } from 'vitest';
import { PET_SIZE_PRESETS, DEFAULT_PET_SIZE_PRESET } from '../desktop/petSizes';
import { PetSizePreset } from '../types/settings';

describe('Pet Size Presets', () => {
  it('defines all required preset tiers', () => {
    const requiredPresets: PetSizePreset[] = ['tiny', 'small', 'medium', 'large'];
    requiredPresets.forEach((preset) => {
      expect(PET_SIZE_PRESETS[preset]).toBeDefined();
      expect(PET_SIZE_PRESETS[preset].width).toBeGreaterThan(0);
      expect(PET_SIZE_PRESETS[preset].height).toBeGreaterThan(0);
      expect(PET_SIZE_PRESETS[preset].label).toBeTruthy();
    });
  });

  it('ensures presets have strictly increasing dimensions', () => {
    expect(PET_SIZE_PRESETS.tiny.width).toBeLessThan(PET_SIZE_PRESETS.small.width);
    expect(PET_SIZE_PRESETS.small.width).toBeLessThan(PET_SIZE_PRESETS.medium.width);
    expect(PET_SIZE_PRESETS.medium.width).toBeLessThan(PET_SIZE_PRESETS.large.width);
  });

  it('sets medium as default preset', () => {
    expect(DEFAULT_PET_SIZE_PRESET).toBe('medium');
  });
});
