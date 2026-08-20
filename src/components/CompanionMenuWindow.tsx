import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CompanionMenu } from './CompanionMenu';
import { AboutCard } from './AboutModal';
import { SettingsService } from '../settings/settingsService';
import {
  hideCompanionMenu,
  hidePetWindow,
  resetWindowPosition,
  checkAutostartEnabled,
  getPetWindowAlwaysOnTop,
  subscribeToTrayEvents,
  subscribeToCompanionMenuShown,
} from '../desktop/windowControl';
import { initializeDatabase } from '../persistence/database';
import { getOrCreatePrimaryPet } from '../persistence/petRepository';
import { AppSettings, DEFAULT_APP_SETTINGS, PetSizePreset } from '../types/settings';
import { PetProfile, SpeciesIdentity } from '../types/pet';
import speciesBlueprint from '../../brain/species/identity.json';

const species: SpeciesIdentity = speciesBlueprint as SpeciesIdentity;

export const CompanionMenuWindow: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [view, setView] = useState<'menu' | 'about'>('menu');
  const viewRef = useRef<'menu' | 'about'>('menu');
  viewRef.current = view;

  const refreshState = useCallback(async () => {
    try {
      await initializeDatabase();
      const [loadedSettings, autostart, alwaysOnTop, profile] = await Promise.all([
        SettingsService.loadSettings(),
        checkAutostartEnabled(),
        getPetWindowAlwaysOnTop(),
        getOrCreatePrimaryPet(species),
      ]);
      setSettings({
        ...loadedSettings,
        autostart,
        alwaysOnTop,
      });
      setPetProfile(profile);
    } catch (err) {
      console.error('Failed to load companion menu settings:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Window event listeners: shown, tray events, escape key, and blur
  useEffect(() => {
    let unlistenShown: (() => void) | undefined;
    let unlistenTray: (() => void) | undefined;

    subscribeToCompanionMenuShown(() => {
      setView('menu');
      refreshState();
    }).then((unlisten) => {
      unlistenShown = unlisten;
    });

    subscribeToTrayEvents((alwaysOnTop) => {
      setSettings((prev) => ({ ...prev, alwaysOnTop }));
    }).then((unlisten) => {
      unlistenTray = unlisten;
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewRef.current === 'about') {
          setView('menu');
        } else {
          hideCompanionMenu().catch(console.error);
        }
      }
    };

    const handleBlur = () => {
      hideCompanionMenu().catch(console.error);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      if (unlistenShown) unlistenShown();
      if (unlistenTray) unlistenTray();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [refreshState]);

  const handleToggleAlwaysOnTop = async () => {
    const nextVal = !settings.alwaysOnTop;
    try {
      await SettingsService.setAlwaysOnTop(nextVal);
      setSettings((prev) => ({ ...prev, alwaysOnTop: nextVal }));
    } catch (err) {
      console.error('Failed to toggle always on top:', err);
    } finally {
      await hideCompanionMenu();
    }
  };

  const handleChangeSizePreset = async (preset: PetSizePreset) => {
    try {
      await SettingsService.setPetSizePreset(preset);
      setSettings((prev) => ({ ...prev, petSizePreset: preset }));
    } catch (err) {
      console.error('Failed to change pet size preset:', err);
    } finally {
      await hideCompanionMenu();
    }
  };

  const handleToggleAutostart = async () => {
    const nextVal = !settings.autostart;
    try {
      await SettingsService.setAutostart(nextVal);
      setSettings((prev) => ({ ...prev, autostart: nextVal }));
    } catch (err) {
      console.error('Failed to toggle autostart:', err);
    } finally {
      await hideCompanionMenu();
    }
  };

  const handleResetPosition = async () => {
    await hideCompanionMenu();
    await resetWindowPosition();
  };

  const handleHidePet = async () => {
    await hideCompanionMenu();
    await hidePetWindow();
  };

  const handleOpenAbout = () => {
    setView('about');
  };

  const handleCloseAbout = async () => {
    setView('menu');
    await hideCompanionMenu();
  };

  const handleBackToMenu = () => {
    setView('menu');
  };

  return (
    <div className="companion-popup-surface">
      {view === 'menu' ? (
        <CompanionMenu
          settings={settings}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onChangeSizePreset={handleChangeSizePreset}
          onToggleAutostart={handleToggleAutostart}
          onResetPosition={handleResetPosition}
          onHidePet={handleHidePet}
          onOpenAbout={handleOpenAbout}
        />
      ) : (
        <AboutCard
          species={species}
          petProfile={petProfile}
          onBack={handleBackToMenu}
          onClose={handleCloseAbout}
        />
      )}
    </div>
  );
};

