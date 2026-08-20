import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { SimulationCoordinator } from '../simulation/runtime/simulationCoordinator';
import { SimulationSnapshot } from '../simulation/model/petState';
import { SpeciesLifeConfig } from '../simulation/model/speciesLife';
import { SpeciesReactionPack } from '../simulation/model/reactions';
import speciesBlueprint from '../../brain/species/identity.json';
import lifeBlueprint from '../../brain/species/life.json';
import reactionsBlueprint from '../../brain/species/reactions.json';

const species: SpeciesIdentity = speciesBlueprint as SpeciesIdentity;
const lifeConfig: SpeciesLifeConfig = lifeBlueprint as SpeciesLifeConfig;
const reactionPack: SpeciesReactionPack = reactionsBlueprint as SpeciesReactionPack;

export const App: React.FC = () => {
  const [petProfile, setPetProfile] = useState<PetProfile | null>(null);
  const [, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [squishTrigger, setSquishTrigger] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  const coordinatorRef = useRef<SimulationCoordinator | null>(null);

  // Initialize persistence, pet profile, settings, and simulation runtime
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

        // Instantiate simulation coordinator
        const coordinator = new SimulationCoordinator({
          species,
          lifeConfig,
          reactionPack,
          onSnapshotChange: (newSnapshot) => {
            if (mounted) {
              setSnapshot(newSnapshot);
            }
          },
          onSquishImpulse: () => {
            if (mounted) {
              setSquishTrigger((prev) => prev + 1);
            }
          },
        });

        coordinatorRef.current = coordinator;
        const initialSnapshot = await coordinator.initialize(profile.id);

        if (mounted) {
          setPetProfile(profile);
          setSnapshot(initialSnapshot);
          setSettings({
            ...loadedSettings,
            autostart,
            alwaysOnTop,
          });
          reportStage(
            'simulation_bootstrap_success',
            `pet: ${profile.name} (${profile.speciesId}), mood: ${initialSnapshot.mood}`
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
      if (coordinatorRef.current) {
        coordinatorRef.current.destroy().catch(console.error);
        coordinatorRef.current = null;
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
    if (coordinatorRef.current) {
      coordinatorRef.current.performInteraction('poke').catch(console.error);
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
      <ReactionBubble
        trigger={squishTrigger}
        speech={snapshot?.speech}
      />

      <CreatureRenderer
        species={species}
        mood={snapshot?.mood || 'content'}
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
