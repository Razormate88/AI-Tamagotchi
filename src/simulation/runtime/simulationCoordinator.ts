import { emit, listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  createDefaultPetState,
  PetMood,
  PetState,
  SimulationSnapshot,
  SpeechBubbleState,
} from '../model/petState';
import { SpeciesLifeConfig } from '../model/speciesLife';
import { SpeciesReactionPack } from '../model/reactions';
import { SpeciesIdentity } from '../../types/pet';
import { SimulationCore } from '../engine/simulationCore';
import { getOrCreatePetState, savePetState } from '../../persistence/petStateRepository';
import {
  pruneLifeEvents,
  recordLifeEvent,
  recordLifeEvents,
} from '../../persistence/lifeEventRepository';
import { InteractionType } from '../engine/interactionEngine';
import { reportStage, reportError } from '../../desktop/diagnostics';

export interface SimulationCoordinatorOptions {
  species: SpeciesIdentity;
  lifeConfig: SpeciesLifeConfig;
  reactionPack: SpeciesReactionPack;
  onSnapshotChange: (snapshot: SimulationSnapshot) => void;
  onSquishImpulse?: (impulse: number) => void;
}

/**
 * Owns the active Gloop simulation lifecycle in the primary window.
 * Single runtime authority for wall-clock advancement, persistence scheduling,
 * autonomous decision making, and multi-window state broadcasting.
 */
export class SimulationCoordinator {
  private state: PetState | null = null;
  private mood: PetMood = 'content';
  private speech: SpeechBubbleState | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private unlistenInteraction: UnlistenFn | null = null;
  private unlistenSnapshotReq: UnlistenFn | null = null;

  private lastPersistTime: number = 0;
  private lastPruneTime: number = 0;
  private recentPokeTimestamps: number[] = [];
  private isDestroyed: boolean = false;

  constructor(private readonly options: SimulationCoordinatorOptions) {}

  /**
   * Initializes database state, runs offline catch-up, and starts the heartbeat.
   */
  public async initialize(petId: string): Promise<SimulationSnapshot> {
    reportStage('simulation_init_start', `petId=${petId}`);

    const defaultState = createDefaultPetState(petId, Date.now());
    const { state: loadedState, isNew } = await getOrCreatePetState(petId, defaultState);

    const now = Date.now();
    let currentState = loadedState;

    if (isNew) {
      reportStage('simulation_seeded_new_pet', `petId=${petId}`);
      await recordLifeEvent({
        petId,
        eventType: 'pet.born',
        occurredAt: now,
        importance: 1.0,
        payloadJson: JSON.stringify({ speciesId: this.options.species.speciesId }),
      });
    } else {
      // Run O(1) offline catch-up
      const catchup = SimulationCore.catchup(
        loadedState,
        now,
        this.options.lifeConfig,
        this.options.reactionPack
      );
      currentState = catchup.nextState;

      if (catchup.lifeEvents.length > 0) {
        await recordLifeEvents(catchup.lifeEvents);
      }

      if (catchup.returnReaction) {
        this.speech = {
          text: catchup.returnReaction.text,
          category: catchup.returnReaction.category,
          priority: 'urgent',
          expiresAt: now + 5000,
        };
      }

      await savePetState(currentState);
      reportStage('simulation_catchup_complete', `elapsedMs=${now - loadedState.simulationUpdatedAt}`);
    }

    this.state = currentState;
    this.mood = SimulationCore.getMood(this.state, now, this.options.lifeConfig);
    this.lastPersistTime = now;

    // Prune life events periodically on startup
    await pruneLifeEvents(petId);

    // Setup Tauri event listeners for multi-window requests from companion-menu
    await this.setupIpcListeners();

    // Start wall-clock heartbeat
    this.startHeartbeat();

    const snapshot = this.getSnapshot();
    this.options.onSnapshotChange(snapshot);
    await this.broadcastSnapshot(snapshot);

    reportStage('simulation_ready', `mood=${this.mood}, activity=${this.state.currentActivity}`);
    return snapshot;
  }

  /**
   * Sets up Tauri IPC listeners for multi-window interaction and snapshot requests.
   */
  private async setupIpcListeners(): Promise<void> {
    try {
      this.unlistenInteraction = await listen<{ type: InteractionType }>(
        'perform-pet-interaction',
        async (event) => {
          if (event.payload && event.payload.type) {
            await this.performInteraction(event.payload.type);
          }
        }
      );

      this.unlistenSnapshotReq = await listen('request-simulation-snapshot', async () => {
        const snapshot = this.getSnapshot();
        await this.broadcastSnapshot(snapshot);
      });
    } catch (err) {
      reportError('ipc_listeners_setup_failed', err);
    }
  }

  /**
   * Starts low-frequency simulation heartbeat (1 second intervals).
   */
  private startHeartbeat(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  /**
   * Heartbeat step: advances wall-clock simulation deterministically.
   */
  private tick(): void {
    if (!this.state || this.isDestroyed) return;

    const now = Date.now();

    // Expire speech bubble if past expiration
    if (this.speech && now >= this.speech.expiresAt) {
      this.speech = null;
    }

    const prevActivity = this.state.currentActivity;
    const prevSleepState = this.state.sleepState;

    const result = SimulationCore.step(
      this.state,
      now,
      this.options.lifeConfig,
      this.options.reactionPack,
      this.options.species.temperamentTags
    );

    this.state = result.nextState;
    this.mood = result.mood;

    if (result.speechBubble) {
      // Urgent speech replaces low/normal; otherwise set if no active speech
      if (!this.speech || result.speechBubble.priority === 'urgent' || this.speech.priority === 'low') {
        this.speech = result.speechBubble;
      }
    }

    // Record any new life events
    if (result.lifeEvents.length > 0) {
      recordLifeEvents(result.lifeEvents).catch((err) =>
        reportError('record_events_failed', err)
      );
    }

    const snapshot = this.getSnapshot();
    this.options.onSnapshotChange(snapshot);

    // Save state on key transitions or every 20 seconds
    const activityChanged = prevActivity !== this.state.currentActivity;
    const sleepChanged = prevSleepState !== this.state.sleepState;
    const isPeriodicSave = (now - this.lastPersistTime) >= 20000;

    if (activityChanged || sleepChanged || isPeriodicSave) {
      this.lastPersistTime = now;
      savePetState(this.state).catch((err) =>
        reportError('persist_pet_state_failed', err)
      );
      this.broadcastSnapshot(snapshot).catch(console.error);
    }

    // Periodic life event pruning (every 10 minutes)
    if (now - this.lastPruneTime > 600000) {
      this.lastPruneTime = now;
      pruneLifeEvents(this.state.petId).catch(console.error);
    }
  }

  /**
   * Executes a manual care or status interaction.
   */
  public async performInteraction(type: InteractionType): Promise<void> {
    if (!this.state || this.isDestroyed) return;

    const now = Date.now();

    // Clean poke history older than 4 seconds
    this.recentPokeTimestamps = this.recentPokeTimestamps.filter(
      (t) => now - t < 4000
    );
    if (type === 'poke') {
      this.recentPokeTimestamps.push(now);
    }
    const recentPokeCount = this.recentPokeTimestamps.length;

    const result = SimulationCore.interact(
      this.state,
      type,
      now,
      this.options.lifeConfig,
      this.options.reactionPack,
      recentPokeCount
    );

    this.state = result.nextState;
    this.mood = SimulationCore.getMood(this.state, now, this.options.lifeConfig);

    if (result.speechBubble) {
      this.speech = {
        text: result.speechBubble.text,
        category: result.speechBubble.category,
        priority: result.speechBubble.priority,
        expiresAt: now + 4000,
      };
    }

    if (result.squishImpulse && this.options.onSquishImpulse) {
      this.options.onSquishImpulse(result.squishImpulse);
    }

    if (result.lifeEvents.length > 0) {
      await recordLifeEvents(result.lifeEvents);
    }

    await savePetState(this.state);
    this.lastPersistTime = now;

    const snapshot = this.getSnapshot();
    this.options.onSnapshotChange(snapshot);
    await this.broadcastSnapshot(snapshot);
  }

  /**
   * Broadcasts current snapshot to secondary windows (such as companion-menu).
   */
  private async broadcastSnapshot(snapshot: SimulationSnapshot): Promise<void> {
    try {
      await emit('simulation-state-updated', snapshot);
    } catch {
      // ignore if Tauri emitter not ready in non-tauri context
    }
  }

  /**
   * Gets the current immutable simulation snapshot.
   */
  public getSnapshot(): SimulationSnapshot {
    if (!this.state) {
      throw new Error('SimulationCoordinator has not been initialized');
    }
    return {
      state: { ...this.state },
      mood: this.mood,
      speech: this.speech ? { ...this.speech } : null,
    };
  }

  /**
   * Diagnostic summary for dev debugging.
   */
  public getDiagnosticSummary(): string {
    if (!this.state) return 'Uninitialized';
    const s = this.state;
    return `[SIM] pet=${s.petId} | satiety=${s.satiety.toFixed(1)}, energy=${s.energy.toFixed(1)}, fun=${s.fun.toFixed(1)}, social=${s.social.toFixed(1)} | mood=${this.mood}, act=${s.currentActivity}, sleep=${s.sleepState}, rev=${s.revision}`;
  }

  /**
   * Cleanly shuts down simulation and persists final state.
   */
  public async destroy(): Promise<void> {
    this.isDestroyed = true;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.unlistenInteraction) {
      this.unlistenInteraction();
      this.unlistenInteraction = null;
    }
    if (this.unlistenSnapshotReq) {
      this.unlistenSnapshotReq();
      this.unlistenSnapshotReq = null;
    }
    if (this.state) {
      try {
        await savePetState(this.state);
      } catch (err) {
        reportError('destroy_save_failed', err);
      }
    }
  }
}
