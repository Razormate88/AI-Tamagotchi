import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CompanionMenu } from './CompanionMenu';
import { AboutCard } from './AboutModal';
import { CareStatusView } from './CareStatusView';
import { MindView } from './MindView';
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
import { PetMood, PetState, SimulationSnapshot } from '../simulation/model/petState';
import { MindPresentationSnapshot } from '../mind/model/mindState';
import { InteractionType } from '../simulation/engine/interactionEngine';
import { emit, listen } from '@tauri-apps/api/event';
import speciesBlueprint from '../../brain/species/identity.json';

const species: SpeciesIdentity = speciesBlueprint as SpeciesIdentity;

export const CompanionMenuWindow: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [petState, setPetState] = useState<PetState | null>(null);
  const [mindSnapshot, setMindSnapshot] = useState<MindPresentationSnapshot | null>(null);
  const [mood, setMood] = useState<PetMood>('content');
  const [view, setView] = useState<'menu' | 'care' | 'mind' | 'about'>('menu');
  const viewRef = useRef<'menu' | 'care' | 'mind' | 'about'>('menu');
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

      // Request fresh simulation and mind snapshots from the authoritative main window
      await emit('request-simulation-snapshot', {});
      await emit('request-mind-snapshot', {});
    } catch (err) {
      console.error('Failed to load companion menu settings:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Window event listeners: snapshot updates, shown, tray events, escape key, and blur
  useEffect(() => {
    let unlistenShown: (() => void) | undefined;
    let unlistenTray: (() => void) | undefined;
    let unlistenSnapshot: (() => void) | undefined;
    let unlistenMindSnapshot: (() => void) | undefined;

    // Listen to simulation updates broadcasted by main window
    listen<SimulationSnapshot>('simulation-state-updated', (event) => {
      if (event.payload && event.payload.state) {
        setPetState(event.payload.state);
        setMood(event.payload.mood);
      }
    }).then((unlisten) => {
      unlistenSnapshot = unlisten;
    });

    listen<MindPresentationSnapshot>('mind-state-updated', (event) => {
      if (event.payload) {
        setMindSnapshot(event.payload);
      }
    }).then((unlisten) => {
      unlistenMindSnapshot = unlisten;
    });

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
        if (viewRef.current === 'about' || viewRef.current === 'care' || viewRef.current === 'mind') {
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
      if (unlistenSnapshot) unlistenSnapshot();
      if (unlistenMindSnapshot) unlistenMindSnapshot();
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

  const handleOpenCare = () => {
    setView('care');
    emit('request-simulation-snapshot', {}).catch(console.error);
  };

  const handleOpenMind = () => {
    setView('mind');
    emit('request-mind-snapshot', {}).catch(console.error);
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

  const handleInteract = async (type: InteractionType) => {
    try {
      await emit('perform-pet-interaction', { type });
    } catch (err) {
      console.error('Failed to emit pet interaction:', err);
    }
  };

  const handleForgetMemory = async (memoryId: number) => {
    try {
      await emit('forget-memory', { memoryId });
    } catch (err) {
      console.error('Failed to emit forget memory:', err);
    }
  };

  const handleResetLearnedMind = async () => {
    try {
      await emit('reset-learned-mind', {});
    } catch (err) {
      console.error('Failed to emit reset learned mind:', err);
    }
  };

  return (
    <div className="companion-popup-surface">
      {view === 'menu' && (
        <CompanionMenu
          settings={settings}
          onOpenCare={handleOpenCare}
          onOpenMind={handleOpenMind}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onChangeSizePreset={handleChangeSizePreset}
          onToggleAutostart={handleToggleAutostart}
          onResetPosition={handleResetPosition}
          onHidePet={handleHidePet}
          onOpenAbout={handleOpenAbout}
        />
      )}

      {view === 'care' && (
        <CareStatusView
          species={species}
          petState={petState}
          mood={mood}
          onBack={handleBackToMenu}
          onInteract={handleInteract}
        />
      )}

      {view === 'mind' && (
        <MindView
          species={species}
          mindSnapshot={mindSnapshot}
          onBack={handleBackToMenu}
          onForgetMemory={handleForgetMemory}
          onResetLearnedMind={handleResetLearnedMind}
        />
      )}

      {view === 'about' && (
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
