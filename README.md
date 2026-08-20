# AI-Tamagotchi

AI-Tamagotchi is a persistent, intelligent desktop companion application. Rather than running in a standard web browser or dashboard window, the creature lives directly on your desktop canvas with transparent surroundings, natural physics, autonomous behaviors, and durable local persistence.

---

## Current Milestone: M003 (Adaptive Mind, Relationship, Memories & Dreams)

M003 establishes that Gloop has a personal history and adaptive mind. Memories form from real life events, relationships evolve dynamically through bond stages (Affection, Trust, Familiarity, Annoyance), personality drifts slowly with experience, preferences and habits develop from interaction patterns, sleep dreams form offline from recent themes, and secret history discoveries unlock—all operating completely offline and deterministically without external AI APIs or cloud services.

### Architectural Summary
- **Desktop Framework:** [Tauri 2](https://v2.tauri.app/) (Rust native backend)
- **Frontend Stack:** React 19, TypeScript, Vite
- **Renderer:** [PixiJS 8](https://pixijs.com/) (Procedural vector rendering reacting to moods, states, and squish physics)
- **Pure Simulation Engine:** Deterministic simulation core (`src/simulation/`) with wall-clock authority, 32-bit seeded PRNG, utility-based autonomous decision making, and analytical $O(1)$ offline catch-up
- **Adaptive Mind Engine:** Deterministic interpreted mind (`src/mind/`) managing memory formation, analytical decay, recall ranking, relationship dynamics, personality evolution, preference learning, habit recognition, offline dream generation, and secret unlock evaluation
- **Local Persistence:** SQLite via `@tauri-apps/plugin-sql` storing pet profiles, durable simulation state (`pet_state`), life events (`pet_life_events`), mind state (`pet_mind_state`), memories (`pet_memories`), preferences (`pet_preferences`), habits (`pet_habits`), and unlocks (`pet_unlocks`)
- **Gloop's Mind View:** Dedicated interactive view inside companion popup for exploring Bond stages, Personality traits, Discovered Preferences, Memories, Dreams, and Secret Unlocks, with memory Forget agency and safe Reset Learned Mind controls
- **Public Species Brain:** Version-controlled identity (`brain/species/identity.json`), life blueprint (`brain/species/life.json`), reactions (`brain/species/reactions.json`), mind tuning (`brain/species/mind.json`), memory templates (`brain/species/memories.json`), dreams blueprint (`brain/species/dreams.json`), and secrets definitions (`brain/species/secrets.json`)

---

## The Public Brain vs. Private Memory Rule

A foundational architectural rule governs this repository:

1. **PUBLIC / VERSION-CONTROLLED (`brain/`, `src/`):**
   - Species identities, genetics, and visual baselines (`brain/species/identity.json`)
   - Life blueprints, decay rates, and behavior weights (`brain/species/life.json`)
   - Reaction pools, thought templates, and dialog packs (`brain/species/reactions.json`)
   - JSON Schemas validating species definitions (`brain/schema/`)

2. **PRIVATE / LOCAL ONLY (`%APPDATA%`, `~/.config` via SQLite):**
   - Owner conversations and episodic timeline events
   - Current durable need states (`satiety`, `energy`, `fun`, `social`, sleep state)
   - Learned personal facts and relationship bonds
   - Local database records (`tamagotchi.db`)

*Under no circumstances is private owner state or local memory committed to Git.* See [docs/architecture/privacy-boundary.md](docs/architecture/privacy-boundary.md) and [docs/architecture/autonomous-life.md](docs/architecture/autonomous-life.md) for full contracts.

---

## Development Prerequisites

- **Node.js:** v20.x or newer (tested on Node v24.x)
- **npm:** v10.x or newer
- **Rust Toolchain:** `rustc` and `cargo` 1.80+ (with MSVC toolchain on Windows)
- **WebView2:** (Pre-installed on modern Windows 10/11)

---

## Build & Development Commands

```bash
# Install frontend dependencies
npm install

# Run frontend unit tests
npm test

# Run TypeScript type check and build frontend
npm run build

# Validate Rust native backend
cargo check --manifest-path src-tauri/Cargo.toml
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check

# Launch application in desktop development mode
npm run tauri dev
```