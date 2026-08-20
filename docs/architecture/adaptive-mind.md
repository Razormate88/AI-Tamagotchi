# Adaptive Mind, Relationship, Memories & Dreams (M003)

This document describes the architectural foundation for Gloop's interpreted mind, personal history, evolving relationship with the owner, slowly drifting personality, habit recognition, offline dream generation, and secret history discoveries introduced in Milestone M003.

---

## 1. Core Architectural Boundary

M003 establishes a clean separation between raw history and psychological interpretation:
- **`pet_life_events` (M002)**: The immutable raw local stream of what occurred (*What happened*).
- **`pet_mind_state` & `pet_memories` (M003)**: The subjective interpretation layer (*What Gloop remembers, how important it felt, how it changed him, what patterns he learned, and how he feels toward the owner*).

```
M002 Event Occurs (Interaction / Autonomous / Offline Catchup)
                    ↓
        Persisted to pet_life_events
                    ↓
        Mind Coordinator consumes event batch (idempotent cursor)
                    ↓
 ┌──────────────────┼──────────────────┬─────────────────┬──────────────────┐
 ↓                  ↓                  ↓                 ↓                  ↓
Memory Formation  Relationship Delta  Personality Drift  Preference Evidence Habit Detection
                    ↓                  ↓                 ↓                  ↓
              pet_memories       pet_mind_state    pet_preferences      pet_habits
                    └──────────────────┬─────────────────┘
                                       ↓
                           Evaluate Secret Unlocks
                                       ↓
                             pet_unlocks
                                       ↓
                     Broadcast Presentation Snapshot
```

All cognitive layers operate completely offline, deterministically, without any LLMs, cloud APIs, embeddings, vector databases, or remote telemetry.

---

## 2. SQLite Schema & Persistence Layer

Migration Version 3 adds the following relational tables in SQLite:

1. **`pet_mind_state`**:
   - `pet_id` (PRIMARY KEY)
   - Relationship dimensions: `affection`, `trust`, `familiarity`, `annoyance` (all `0..100`)
   - Personality traits: `curiosity`, `playfulness`, `affectionateness`, `mischief`, `independence`, `patience` (all `0..100`)
   - Processing cursor: `processed_life_event_id`, `mind_updated_at`, `revision`

2. **`pet_memories`**:
   - `id` (AUTOINCREMENT PRIMARY KEY), `pet_id`, `memory_type`, `subject_key`, `formed_at`, `last_reinforced_at`, `last_recalled_at`, `salience`, `strength`, `valence`, `reinforcement_count`, `protected`, `payload_json`.
   - Indexed by `(pet_id, formed_at)`, `(pet_id, salience)`, and `(pet_id, subject_key)`.

3. **`pet_preferences`**:
   - `pet_id`, `preference_key` (Composite Primary Key), `affinity` (-100..+100), `confidence` (0..1), `sample_count`, `updated_at`.

4. **`pet_habits`**:
   - `pet_id`, `habit_key` (Composite Primary Key), `strength` (0..100), `sample_count`, `last_observed_at`, `payload_json`.

5. **`pet_unlocks`**:
   - `pet_id`, `unlock_key` (Composite Primary Key), `unlocked_at`, `payload_json`.

---

## 3. Relationship & Bond Stages

Relationship state comprises four bounded dimensions ($0 \dots 100$):
- **Affection**: Positive emotional resonance. Increases from timely feeding, comforting pets, and play. Decreases mildly from repeated poke spam or waking while exhausted.
- **Trust**: Sense of security and reliability. Increases from regular care, responding to critical needs, and returning after absence.
- **Familiarity**: Cumulative shared history. Increases from time spent together, meaningful interactions, and returns. Never collapses from temporary annoyance.
- **Annoyance**: Short/medium-term irritation from poke spam or forced wakeups. Decays analytically with a configured half-life (~30 minutes).

### Bond Stages
Bond stage is derived from the combination of familiarity, affection, and trust:
1. **New Creature**: Initial baseline.
2. **Acquaintance**: Familiarity $\ge 15$, Affection $\ge 35$, Trust $\ge 30$.
3. **Buddy**: Familiarity $\ge 35$, Affection $\ge 52$, Trust $\ge 48$.
4. **Close Friend**: Familiarity $\ge 60$, Affection $\ge 70$, Trust $\ge 68$.
5. **Best Friend**: Familiarity $\ge 80$, Affection $\ge 84$, Trust $\ge 82$.
6. **Bonded Soul**: Familiarity $\ge 95$, Affection $\ge 92$, Trust $\ge 90$.

---

## 4. Personality Drift & Behavioral Modifiers

Personality traits evolve slowly from life experiences with diminishing returns as they deviate from the species baseline:
$$\text{effectiveDelta} = \text{delta} \times \left(1 - \frac{|\text{current} - \text{baseline}|}{\text{maxDrift}}\right)$$

- **Curiosity**: Elevated by autonomous daydreaming and inspecting objects; increases autonomous inspection/look-around weighting.
- **Playfulness**: Elevated by playful interactions; increases bounce, self-play, and celebration weighting.
- **Affectionateness**: Elevated by gentle petting sessions; increases attention-seeking and celebration weighting.
- **Mischief**: Elevated by poking antics; increases playful sulking and bouncy chaos.
- **Independence**: Elevated by comfortable extended autonomous periods; slightly reduces attention-seeking frequency.
- **Patience**: Gradually reinforced by gentle care; reduced by poke spam.

---

## 5. Preferences & Habit Learning

### Preferences
Tracks affinity ($-100 \dots +100$) and confidence ($0 \dots 1$) for interactions (`feed`, `pet`, `play`, `poke`, `sleep`, `wake`):
- Evidence sample valences reflect Gloop's state at the moment of interaction (e.g. playing when bored is $+80$, playing when exhausted is $-65$; feeding when hungry is $+75$, feeding when stuffed is $-55$).
- Progressive sample weighting: $\text{learningWeight} = \frac{1}{\sqrt{N}}$, ensuring stability after repeated samples.

### Habits
Recognizes broad local time-of-day visit patterns (`morning`, `afternoon`, `evening`, `night`) using session and return timestamps only. No external applications, files, or desktop contents are ever inspected. Requires at least 4 consistent samples before considered confident.

---

## 6. Memory Formation, Decay, & Recall

### Memory Formation
- **Protected Firsts**: Unique milestone experiences (`first.feed`, `first.pet`, `first.play`, `first.poke`, `first.sleep`, `first.long_absence`, `first.very_long_return`, `first.grumpy`, `first.bond_stage_upgrade`, `first.secret_discovery`) are marked with `protected = 1` and never pruned.
- **Reinforcement**: Repeated similar care or conflict interactions update existing structured records (e.g. `conflict.poking`, `care.feeding`) and increment `reinforcement_count`, avoiding database bloat.

### Analytical Decay & Bound Enforcement
- Memory strength decays continuously by elapsed wall-clock time according to importance-tiered half-lives (mundane: 2 days, moderate: 14 days, major: 60 days).
- Periodic pruning removes weak ($< 0.08$), low-salience, unprotected memories, keeping active durable memories bounded ($\le 300$).

### Recall Engine
Ranks candidate memories by:
$$\text{Score} = (\text{Relevance} \times 0.4) + (\text{Salience} \times 0.3) + (\text{Strength} \times 0.2) + \text{ReinforcementBonus}$$
Applies a recall cooldown (3 minutes) to prevent repetitive callbacks.

---

## 7. Dream Engine & History-Based Secrets

### Sleep Dreams
When Gloop wakes after a meaningful sleep ($\ge 2$ minutes), the dream engine deterministically synthesizes a surreal, quirky dream based on recent memory themes (food, play, mischief, absence, affection, lonely, general), current mood, and personality. The dream is stored as `memory_type = 'dream'` and visible in the Mind view.

### Secret Discoveries
Evaluates 10 history-grounded secrets (e.g. `poke_documentation`, `food_singularity`, `old_friend`, `you_came_back`, `chaos_enabler`, `dreamer`, `creature_of_habit`, `no_personal_space`, `night_owl`, `patient_saint`) and persists unlocks to `pet_unlocks`.

---

## 8. Multi-Window Coordination & User Agency

- **Single Authority**: The `main` window runs the single active `MindCoordinator`. Secondary windows (e.g. `companion-menu`) read presentation snapshots and dispatch user requests via Tauri IPC (`request-mind-snapshot`, `forget-memory`, `reset-learned-mind`).
- **Forget Memory**: Allows the owner to forget specific individual memories. The forgotten memory is removed from recall and not reconstructed from old processed events.
- **Reset Learned Mind**: Safely resets memories, preferences, habits, unlocks, and personality drift to default species baselines while preserving pet identity, creation date, M002 needs, sleep state, and window settings.
