import React, { useEffect, useRef } from 'react';
import { AppSettings, PetSizePreset } from '../types/settings';
import { ContextMenuPosition } from '../types/desktop';
import { PET_SIZE_PRESETS } from '../desktop/petSizes';

interface CompanionMenuProps {
  position: ContextMenuPosition;
  settings: AppSettings;
  onToggleAlwaysOnTop: () => void;
  onChangeSizePreset: (preset: PetSizePreset) => void;
  onToggleAutostart: () => void;
  onResetPosition: () => void;
  onHidePet: () => void;
  onOpenAbout: () => void;
  onClose: () => void;
}

export const CompanionMenu: React.FC<CompanionMenuProps> = ({
  position,
  settings,
  onToggleAlwaysOnTop,
  onChangeSizePreset,
  onToggleAutostart,
  onResetPosition,
  onHidePet,
  onOpenAbout,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust menu position so it doesn't overflow the viewport
  const style: React.CSSProperties = {
    left: Math.min(position.x, Math.max(10, window.innerWidth - 180)),
    top: Math.min(position.y, Math.max(10, window.innerHeight - 260)),
  };

  return (
    <div
      ref={menuRef}
      className="companion-menu"
      style={style}
      role="menu"
      aria-label="Companion Controls"
    >
      <div className="menu-header">Companion Menu</div>

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
