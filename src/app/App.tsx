import React, { useEffect, useState, useCallback } from 'react';
import { CreatureRenderer } from '../creature/CreatureRenderer';
import { ReactionBubble } from '../components/ReactionBubble';
import { usePetInteraction } from '../desktop/usePetInteraction';
import { initializeDatabase } from '../persistence/database';
import { getOrCreatePrimaryPet, updatePetLastSeen } from '../persistence/petRepository';
import { SettingsService } from '../settings/settingsService';
import {
  subscribeToTrayEvents,
  checkAutostartEnabled,
  getPetWindowAlwaysOnTop,
  toggleCompanionMenu,
} from '../desktop/windowControl';
import { reportStage, reportError } from '../desktop/diagnostics';
import { PetProfile, SpeciesIdentity } from '../types/pet';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../types/settings';
import { ContextMenuPosition } from '../types/desktop';
import speciesBlueprint from '../../brain/species/identity.json';

const species: SpeciesIdentity = speciesBlueprint as SpeciesIdentity;

export const App: React.FC = () => {
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [squishTrigger, setSquishTrigger] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize persistence, pet profile, and settings
  useEffect(() => {
    let mounted = true;
    reportStage('app_mounted');

    async function init() {
      try {
        await initializeDatabase();
        const profile = await getOrCreatePrimaryPet(species);
        const loadedSettings = await SettingsService.loadSettings();

        // Check native autostart and always-on-top states
        const autostart = await checkAutostartEnabled();
        const alwaysOnTop = await getPetWindowAlwaysOnTop();

        if (mounted) {
          setPetProfile(profile);
          setSettings({
            ...loadedSettings,
            autostart,
            alwaysOnTop,
          });
          reportStage(
            'persistence_init_success',
            `pet: ${profile.name} (${profile.speciesId}), autostart: ${autostart}, alwaysOnTop: ${alwaysOnTop}`
          );
        }
      } catch (err) {
        console.error('Fatal initialization error:', err);
        reportError('persistence_init_failed', err);
        if (mounted) {
          setInitError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    init();

    // Listen to tray toggles
    let unlistenTray: (() => void) | undefined;
    subscribeToTrayEvents((alwaysOnTop) => {
      if (mounted) {
        setSettings((prev) => ({ ...prev, alwaysOnTop }));
      }
    }).then((unlisten) => {
      unlistenTray = unlisten;
    });

    return () => {
      mounted = false;
      if (unlistenTray) {
        unlistenTray();
      }
    };
  }, []);

  const handlePetClick = useCallback(() => {
    setSquishTrigger((prev) => prev + 1);
    if (petProfile) {
      updatePetLastSeen(petProfile.id).catch((err) =>
        console.error('Failed to update pet last seen:', err)
      );
    }
  }, [petProfile]);

  const handleOpenContextMenu = useCallback((pos: ContextMenuPosition) => {
    toggleCompanionMenu(pos.x, pos.y).catch((err) =>
      console.error('Failed to toggle companion menu:', err)
    );
  }, []);

  const { onPointerDown, onPointerMove, onPointerUp, onContextMenu } = usePetInteraction({
    onClickPet: handlePetClick,
    onOpenContextMenu: handleOpenContextMenu,
  });

  if (initError) {
    return (
      <div className="app-container" style={{ padding: 12 }}>
        <div className="about-card" style={{ maxWidth: '100%' }}>
          <div className="about-title" style={{ color: '#ff7675' }}>
            Initialization Error
          </div>
          <div className="about-value" style={{ fontSize: 11, marginTop: 4 }}>
            {initError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <ReactionBubble trigger={squishTrigger} />

      <CreatureRenderer
        species={species}
        squishTrigger={squishTrigger}
        isHovered={isHovered}
        onHoverChange={setIsHovered}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={onContextMenu}
      />
    </div>
  );
};
