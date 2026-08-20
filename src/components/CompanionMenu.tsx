import React from 'react';
import { AppSettings, PetSizePreset } from '../types/settings';
import { PET_SIZE_PRESETS } from '../desktop/petSizes';

export interface CompanionMenuProps {
  settings: AppSettings;
  onOpenCare: () => void;
  onToggleAlwaysOnTop: () => void;
  onChangeSizePreset: (preset: PetSizePreset) => void;
  onToggleAutostart: () => void;
  onResetPosition: () => void;
  onHidePet: () => void;
  onOpenAbout: () => void;
}

export const CompanionMenu: React.FC<CompanionMenuProps> = ({
  settings,
  onOpenCare,
  onToggleAlwaysOnTop,
  onChangeSizePreset,
  onToggleAutostart,
  onResetPosition,
  onHidePet,
  onOpenAbout,
}) => {
  return (
    <div className="companion-menu" role="menu" aria-label="Companion Controls">
      <div className="menu-header">Companion Menu</div>

      <button
        className="menu-item action-item care-entry-item"
        role="menuitem"
        onClick={onOpenCare}
      >
        <span className="care-entry-title">💖 Care for Gloop</span>
        <span className="care-entry-arrow">→</span>
      </button>

      <div className="menu-divider" />

      <button
        className="menu-item toggle-item"
        role="menuitemcheckbox"
        aria-checked={settings.alwaysOnTop}
        onClick={onToggleAlwaysOnTop}
      >
        <span>Always on Top</span>
        <span className="checkbox-indicator">{settings.alwaysOnTop ? '✓' : ''}</span>
      </button>

      <div className="menu-divider" />

      <div className="menu-submenu-header">Pet Size</div>
      {(['tiny', 'small', 'medium', 'large'] as PetSizePreset[]).map((preset) => (
        <button
          key={preset}
          className={`menu-item size-item ${settings.petSizePreset === preset ? 'active' : ''}`}
          role="menuitemradio"
          aria-checked={settings.petSizePreset === preset}
          onClick={() => onChangeSizePreset(preset)}
        >
          <span>{PET_SIZE_PRESETS[preset].label}</span>
          {settings.petSizePreset === preset && <span className="active-dot">•</span>}
        </button>
      ))}

      <div className="menu-divider" />

      <button
        className="menu-item toggle-item"
        role="menuitemcheckbox"
        aria-checked={settings.autostart}
        onClick={onToggleAutostart}
      >
        <span>Launch at Startup</span>
        <span className="checkbox-indicator">{settings.autostart ? '✓' : ''}</span>
      </button>

      <button
        className="menu-item action-item"
        role="menuitem"
        onClick={onResetPosition}
      >
        <span>Reset Position</span>
      </button>

      <button
        className="menu-item action-item"
        role="menuitem"
        onClick={onHidePet}
      >
        <span>Hide Pet (Tray)</span>
      </button>

      <div className="menu-divider" />

      <button
        className="menu-item action-item"
        role="menuitem"
        onClick={onOpenAbout}
      >
        <span>About AI-Tamagotchi</span>
      </button>
    </div>
  );
};
