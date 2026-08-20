import { PetSizePreset } from './settings';

export interface PetSizeConfig {
  preset: PetSizePreset;
  label: string;
  width: number;
  height: number;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}
