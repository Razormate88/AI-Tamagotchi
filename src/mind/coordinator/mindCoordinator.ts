import { emit } from '@tauri-apps/api/event';
import {
  MindPresentationSnapshot,
  PetHabit,
  PetMemory,
  PetMindState,
  PetPreference,
  PetUnlock,
} from '../model/mindState';
import { SpeciesMindConfig } from '../model/mindConfig';
import { SpeciesMemoriesConfig } from '../model/memoryTemplates';
import { SpeciesDreamsConfig } from '../model/dreamTemplates';
import { SpeciesSecretsConfig } from '../model/secretDefinitions';
import {
  deleteMemory,
  getHabits,
  getMemoriesForPet,
  getPetMindState,
  getPreferences,
  getUnlocks,
  insertMemory,
  resetMindData,
  saveHabit,
  savePetMindState,
  savePreference,
  saveUnlock,
  updateMemory,
} from '../../persistence/mindRepository';
import {
  getLifeEventsAfter,
  getMaxLifeEventId,
} from '../../persistence/lifeEventRepository';
import { PetLifeEvent } from '../../simulation/model/petState';
import {
  applyRelationshipDeltas,
  calculateRelationshipDeltas,
  decayAnnoyance,
} from '../pure/relationshipEngine';
import {
  applyPersonalityDrift,
  calculatePersonalityDeltas,
} from '../pure/personalityEngine';
import {
  calculateSampleValence,
  updatePreferenceWithSample,
} from '../pure/preferenceEngine';
import {
  getTimeBucket,
  recordHabitObservation,
} from '../pure/habitEngine';
import { evaluateLifeEventMemory } from '../pure/memoryFormation';
import {
  calculateDecayedMemory,
  identifyPrunableMemories,
} from '../pure/memoryDecay';
import { selectRecalledMemory } from '../pure/recallEngine';
import { evaluateSleepDream } from '../pure/dreamEngine';
import { evaluateSecretUnlocks } from '../pure/secretEngine';
import { buildMindPresentationSnapshot } from '../presentation/mindPresentation';
import { reportError, reportStage } from '../../desktop/diagnostics';
import { formatTemplate } from '../pure/templateFormatter';

export interface MindCoordinatorOptions {
  mindConfig: SpeciesMindConfig;
  memoriesConfig: SpeciesMemoriesConfig;
  dreamsConfig: SpeciesDreamsConfig;
  secretsConfig: SpeciesSecretsConfig;
  onSnapshotChange?: (snapshot: MindPresentationSnapshot) => void;
}

/**
 * Mind Coordinator.
 * Authoritative orchestrator for memory lifecycle, relationship dynamics,
 * personality drift, preferences, habits, dreams, and secret unlocks.
 */
export class MindCoordinator {
  private mindState: PetMindState | null = null;
  private memories: Map<string, PetMemory> = new Map(); // keyed by subjectKey or id
  private memoriesList: PetMemory[] = [];
  private preferences: Map<string, PetPreference> = new Map();
  private habits: Map<string, PetHabit> = new Map();
  private unlocks: Map<string, PetUnlock> = new Map();

  private lastTimeAdvancement: number = 0;
  private lastDreamAt: number = 0;
  private lastPersistTime: number = 0;
  private rngState: number = 12345;

  constructor(private readonly options: MindCoordinatorOptions) {}

  /**
   * Initializes or seeds mind state from SQLite and performs historical event catch-up.
   */
  public async initialize(petId: string, currentRngState: number = 12345): Promise<MindPresentationSnapshot> {
    this.rngState = currentRngState;
    reportStage('mind_init_start', `petId=${petId}`);

    const now = Date.now();
    let state = await getPetMindState(petId);

    if (!state) {
      // Seed default baseline mind state
      state = {
        petId,
        affection: this.options.mindConfig.relationshipBaselines.affection,
        trust: this.options.mindConfig.relationshipBaselines.trust,
        familiarity: this.options.mindConfig.relationshipBaselines.familiarity,
        annoyance: this.options.mindConfig.relationshipBaselines.annoyance,
        curiosity: this.options.mindConfig.personalityBaselines.curiosity,
        playfulness: this.options.mindConfig.personalityBaselines.playfulness,
        affectionateness: this.options.mindConfig.personalityBaselines.affectionateness,
        mischief: this.options.mindConfig.personalityBaselines.mischief,
        independence: this.options.mindConfig.personalityBaselines.independence,
        patience: this.options.mindConfig.personalityBaselines.patience,
        processedLifeEventId: 0,
        mindUpdatedAt: now,
        revision: 1,
      };
      await savePetMindState(state);
      reportStage('mind_seeded_baseline', `petId=${petId}`);
    }

    this.mindState = state;

    // Load active memories, preferences, habits, unlocks
    await this.loadAllMindData(petId);

    // Check for last dream timestamp among loaded memories
    for (const mem of this.memoriesList) {
      if (mem.memoryType === 'dream' && mem.formedAt > this.lastDreamAt) {
        this.lastDreamAt = mem.formedAt;
      }
    }

    // Process unprocessed life events in bounded batches
    const unprocessed = await getLifeEventsAfter(
      petId,
      this.mindState.processedLifeEventId,
      500
    );

    if (unprocessed.length > 0) {
      reportStage('mind_processing_backlog', `count=${unprocessed.length}`);
      await this.processEvents(unprocessed, now);
    } else {
      // Apply analytical decay from last updated time
      this.applyAnalyticalDecay(now);
      await this.persistMindState();
    }

    this.lastTimeAdvancement = now;
    this.lastPersistTime = now;

    const snapshot = this.getPresentationSnapshot();
    if (this.options.onSnapshotChange) {
      this.options.onSnapshotChange(snapshot);
    }
    await this.broadcastSnapshot(snapshot);

    reportStage('mind_ready', `bondAffection=${this.mindState.affection.toFixed(1)}, memories=${this.memoriesList.length}`);
    return snapshot;
  }

  private async loadAllMindData(petId: string): Promise<void> {
    const [mems, prefs, habs, unls] = await Promise.all([
      getMemoriesForPet(petId, this.options.mindConfig.memoryTuning.maxDurableMemories),
      getPreferences(petId),
      getHabits(petId),
      getUnlocks(petId),
    ]);

    this.memoriesList = mems;
    this.memories.clear();
    for (const m of mems) {
      this.memories.set(m.subjectKey, m);
    }

    this.preferences.clear();
    for (const p of prefs) {
      this.preferences.set(p.preferenceKey, p);
    }

    this.habits.clear();
    for (const h of habs) {
      this.habits.set(h.habitKey, h);
    }

    this.unlocks.clear();
    for (const u of unls) {
      this.unlocks.set(u.unlockKey, u);
    }
  }

  /**
   * Applies analytical decay to annoyance and memories based on elapsed wall-clock time.
   */
  public applyAnalyticalDecay(now: number): void {
    if (!this.mindState) return;

    const elapsedMs = Math.max(0, now - this.mindState.mindUpdatedAt);
    if (elapsedMs <= 0) return;

    // Decaying annoyance
    this.mindState.annoyance = decayAnnoyance(
      this.mindState.annoyance,
      elapsedMs,
      this.options.mindConfig.relationshipScaling.annoyanceHalfLifeHours
    );

    // Decaying memory strengths
    const tuning = this.options.mindConfig.memoryTuning;
    this.memoriesList = this.memoriesList.map((m) =>
      calculateDecayedMemory(m, now, tuning)
    );

    // Update memory map
    this.memories.clear();
    for (const m of this.memoriesList) {
      this.memories.set(m.subjectKey, m);
    }

    this.mindState.mindUpdatedAt = now;
  }

  /**
   * Incrementally processes newly recorded life events.
   */
  public async processEvents(events: PetLifeEvent[], now: number): Promise<void> {
    if (!this.mindState || events.length === 0) return;

    const tuning = this.options.mindConfig.memoryTuning;
    const relScaling = this.options.mindConfig.relationshipScaling;
    const persDrift = this.options.mindConfig.personalityDriftRates;
    const prefTuning = this.options.mindConfig.preferenceTuning;
    const baselines = this.options.mindConfig.personalityBaselines;

    let maxEventId = this.mindState.processedLifeEventId;

    for (const event of events) {
      if (event.id && event.id <= this.mindState.processedLifeEventId) {
        continue; // idempotency guard
      }
      if (event.id && event.id > maxEventId) {
        maxEventId = event.id;
      }

      let payload: Record<string, any> = {};
      try {
        payload = JSON.parse(event.payloadJson || '{}');
      } catch {
        payload = {};
      }

      // 1. Evaluate memory formation / reinforcement
      const memoryAction = evaluateLifeEventMemory(event, this.memories, tuning);

      if (memoryAction.action === 'create') {
        const newMemory: PetMemory = {
          petId: this.mindState.petId,
          memoryType: memoryAction.memoryType,
          subjectKey: memoryAction.subjectKey,
          formedAt: event.occurredAt,
          lastReinforcedAt: event.occurredAt,
          lastRecalledAt: null,
          salience: memoryAction.salience,
          strength: memoryAction.strength,
          valence: memoryAction.valence,
          reinforcementCount: 1,
          protected: memoryAction.protected,
          payloadJson: JSON.stringify(memoryAction.payload),
        };
        const insertedId = await insertMemory(newMemory);
        newMemory.id = insertedId;
        this.memories.set(newMemory.subjectKey, newMemory);
        this.memoriesList.unshift(newMemory);
      } else if (memoryAction.action === 'reinforce') {
        const existing = this.memories.get(memoryAction.subjectKey);
        if (existing) {
          existing.reinforcementCount += 1;
          existing.lastReinforcedAt = event.occurredAt;
          existing.strength = Math.min(1.0, existing.strength + 0.25);
          existing.payloadJson = JSON.stringify(memoryAction.payload);
          await updateMemory(existing);
        }
      }

      // 2. Relationship update
      const relDeltas = calculateRelationshipDeltas(event.eventType, payload, relScaling);
      const nextRel = applyRelationshipDeltas(
        {
          affection: this.mindState.affection,
          trust: this.mindState.trust,
          familiarity: this.mindState.familiarity,
          annoyance: this.mindState.annoyance,
        },
        relDeltas
      );
      this.mindState.affection = nextRel.affection;
      this.mindState.trust = nextRel.trust;
      this.mindState.familiarity = nextRel.familiarity;
      this.mindState.annoyance = nextRel.annoyance;

      // 3. Personality drift update
      const persDeltas = calculatePersonalityDeltas(event.eventType, payload, persDrift);
      const nextPers = applyPersonalityDrift(
        {
          curiosity: this.mindState.curiosity,
          playfulness: this.mindState.playfulness,
          affectionateness: this.mindState.affectionateness,
          mischief: this.mindState.mischief,
          independence: this.mindState.independence,
          patience: this.mindState.patience,
        },
        persDeltas,
        baselines,
        persDrift
      );
      this.mindState.curiosity = nextPers.curiosity;
      this.mindState.playfulness = nextPers.playfulness;
      this.mindState.affectionateness = nextPers.affectionateness;
      this.mindState.mischief = nextPers.mischief;
      this.mindState.independence = nextPers.independence;
      this.mindState.patience = nextPers.patience;

      // 4. Preference update
      if (event.eventType.startsWith('interaction.')) {
        const sampleValence = calculateSampleValence(event.eventType, payload);
        if (sampleValence !== null) {
          const currentPref = this.preferences.get(event.eventType) || null;
          const updatedPref = updatePreferenceWithSample(
            currentPref,
            this.mindState.petId,
            event.eventType,
            sampleValence,
            event.occurredAt,
            prefTuning
          );
          this.preferences.set(event.eventType, updatedPref);
          await savePreference(updatedPref);
        }
      }

      // 5. Habit recording (session / interaction time buckets)
      const timeBucket = getTimeBucket(event.occurredAt);
      const habitKey = `owner.session.${timeBucket}`;
      const currentHabit = this.habits.get(habitKey) || null;
      const updatedHabit = recordHabitObservation(
        currentHabit,
        this.mindState.petId,
        habitKey,
        event.occurredAt,
        { timeBucket }
      );
      this.habits.set(habitKey, updatedHabit);
      await saveHabit(updatedHabit);
    }

    // 6. Evaluate secret unlocks
    const unlockedKeys = new Set(Array.from(this.unlocks.keys()));
    const newSecrets = evaluateSecretUnlocks(
      {
        petId: this.mindState.petId,
        mindState: this.mindState,
        memories: this.memoriesList,
        preferences: Array.from(this.preferences.values()),
        habits: Array.from(this.habits.values()),
        unlockedKeys,
        now,
      },
      this.options.secretsConfig.secrets
    );

    for (const secret of newSecrets) {
      this.unlocks.set(secret.unlockKey, secret);
      await saveUnlock(secret);
      reportStage('secret_unlocked', `key=${secret.unlockKey}`);
    }

    this.mindState.processedLifeEventId = maxEventId;
    this.mindState.mindUpdatedAt = now;
    this.mindState.revision += 1;

    await this.persistMindState();
    const snapshot = this.getPresentationSnapshot();
    if (this.options.onSnapshotChange) {
      this.options.onSnapshotChange(snapshot);
    }
    await this.broadcastSnapshot(snapshot);
  }

  /**
   * Periodic heartbeat step from main simulation.
   */
  public async tick(now: number): Promise<void> {
    if (!this.mindState) return;

    // Apply continuous annoyance & memory decay every 15 seconds
    if (now - this.lastTimeAdvancement >= 15000) {
      this.applyAnalyticalDecay(now);
      this.lastTimeAdvancement = now;

      // Periodic pruning check
      const prunable = identifyPrunableMemories(
        this.memoriesList,
        this.options.mindConfig.memoryTuning
      );
      if (prunable.length > 0) {
        for (const id of prunable) {
          await deleteMemory(this.mindState.petId, id);
        }
        this.memoriesList = this.memoriesList.filter((m) => !prunable.includes(m.id!));
        this.memories.clear();
        for (const m of this.memoriesList) {
          this.memories.set(m.subjectKey, m);
        }
      }

      if (now - this.lastPersistTime >= 30000) {
        this.lastPersistTime = now;
        await this.persistMindState();
      }
    }
  }

  /**
   * Handles pet sleep wake event to check dream eligibility.
   */
  public async handleSleepWake(sleepDurationMs: number, now: number): Promise<string | null> {
    if (!this.mindState) return null;

    const result = evaluateSleepDream(
      {
        petId: this.mindState.petId,
        sleepDurationMs,
        lastDreamAt: this.lastDreamAt,
        recentMemories: this.memoriesList.slice(0, 10),
        personality: {
          curiosity: this.mindState.curiosity,
          playfulness: this.mindState.playfulness,
          affectionateness: this.mindState.affectionateness,
          mischief: this.mindState.mischief,
          independence: this.mindState.independence,
          patience: this.mindState.patience,
        },
        now,
        rngState: this.rngState,
      },
      this.options.mindConfig.dreamTuning,
      this.options.dreamsConfig
    );

    this.rngState = result.nextRngState;

    if (result.dreamMemory) {
      const insertedId = await insertMemory(result.dreamMemory);
      result.dreamMemory.id = insertedId;
      this.memories.set(result.dreamMemory.subjectKey, result.dreamMemory);
      this.memoriesList.unshift(result.dreamMemory);
      this.lastDreamAt = now;

      reportStage('dream_formed', `summary=${result.dreamMemory.payloadJson}`);

      const snapshot = this.getPresentationSnapshot();
      if (this.options.onSnapshotChange) {
        this.options.onSnapshotChange(snapshot);
      }
      await this.broadcastSnapshot(snapshot);

      return result.wakeReactionBubble;
    }

    return null;
  }

  /**
   * Evaluates memory recall for reaction speech callbacks.
   */
  public async getRecallSpeech(trigger: string, now: number): Promise<string | null> {
    if (!this.mindState || this.memoriesList.length === 0) return null;

    const result = selectRecalledMemory(
      this.memoriesList,
      {
        trigger,
        now,
        rngState: this.rngState,
      },
      this.options.mindConfig.memoryTuning
    );

    this.rngState = result.nextRngState;

    if (result.recalledMemory && result.recalledMemory.id) {
      result.recalledMemory.lastRecalledAt = now;
      await updateMemory(result.recalledMemory);

      const template = this.options.memoriesConfig.templates[result.recalledMemory.subjectKey];
      if (template) {
        let payload: Record<string, any> = {};
        try {
          payload = JSON.parse(result.recalledMemory.payloadJson || '{}');
        } catch {
          payload = {};
        }
        return formatTemplate(template, {
          ...payload,
          count: result.recalledMemory.reinforcementCount,
        });
      }
    }

    return null;
  }

  /**
   * User agency action: forgets a specific memory.
   */
  public async forgetMemory(memoryId: number): Promise<void> {
    if (!this.mindState) return;
    await deleteMemory(this.mindState.petId, memoryId);

    this.memoriesList = this.memoriesList.filter((m) => m.id !== memoryId);
    this.memories.clear();
    for (const m of this.memoriesList) {
      this.memories.set(m.subjectKey, m);
    }

    const snapshot = this.getPresentationSnapshot();
    if (this.options.onSnapshotChange) {
      this.options.onSnapshotChange(snapshot);
    }
    await this.broadcastSnapshot(snapshot);
    reportStage('memory_forgotten', `memoryId=${memoryId}`);
  }

  /**
   * Resets all learned M003 mind data to species baselines while preserving Gloop identity and needs.
   */
  public async resetLearnedMind(): Promise<void> {
    if (!this.mindState) return;

    const currentMaxId = await getMaxLifeEventId(this.mindState.petId);
    const baselineState: PetMindState = {
      petId: this.mindState.petId,
      affection: this.options.mindConfig.relationshipBaselines.affection,
      trust: this.options.mindConfig.relationshipBaselines.trust,
      familiarity: this.options.mindConfig.relationshipBaselines.familiarity,
      annoyance: this.options.mindConfig.relationshipBaselines.annoyance,
      curiosity: this.options.mindConfig.personalityBaselines.curiosity,
      playfulness: this.options.mindConfig.personalityBaselines.playfulness,
      affectionateness: this.options.mindConfig.personalityBaselines.affectionateness,
      mischief: this.options.mindConfig.personalityBaselines.mischief,
      independence: this.options.mindConfig.personalityBaselines.independence,
      patience: this.options.mindConfig.personalityBaselines.patience,
      processedLifeEventId: currentMaxId,
      mindUpdatedAt: Date.now(),
      revision: this.mindState.revision + 1,
    };

    await resetMindData(this.mindState.petId, baselineState, currentMaxId);

    this.mindState = baselineState;
    this.memories.clear();
    this.memoriesList = [];
    this.preferences.clear();
    this.habits.clear();
    this.unlocks.clear();
    this.lastDreamAt = 0;

    const snapshot = this.getPresentationSnapshot();
    if (this.options.onSnapshotChange) {
      this.options.onSnapshotChange(snapshot);
    }
    await this.broadcastSnapshot(snapshot);
    reportStage('mind_reset_complete', `petId=${this.mindState.petId}`);
  }

  private async persistMindState(): Promise<void> {
    if (!this.mindState) return;
    try {
      await savePetMindState(this.mindState);
    } catch (err) {
      reportError('persist_mind_state_failed', err);
    }
  }

  private async broadcastSnapshot(snapshot: MindPresentationSnapshot): Promise<void> {
    try {
      await emit('mind-state-updated', snapshot);
    } catch {
      // Non-tauri test environment safe ignore
    }
  }

  public getPresentationSnapshot(): MindPresentationSnapshot {
    if (!this.mindState) {
      throw new Error('MindCoordinator has not been initialized');
    }
    return buildMindPresentationSnapshot(
      this.mindState,
      this.memoriesList,
      Array.from(this.preferences.values()),
      Array.from(this.habits.values()),
      Array.from(this.unlocks.values()),
      this.options.mindConfig,
      this.options.memoriesConfig,
      this.options.secretsConfig,
      Date.now()
    );
  }

  public getMindState(): PetMindState {
    if (!this.mindState) {
      throw new Error('MindCoordinator has not been initialized');
    }
    return { ...this.mindState };
  }
}
