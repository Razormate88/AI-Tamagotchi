# AI-Tamagotchi

AI-Tamagotchi is a persistent, intelligent desktop companion application. Rather than running in a standard web browser or dashboard window, the creature lives directly on your desktop canvas with transparent surroundings, natural physics, autonomous behaviors, and durable local persistence.

---

## Current Milestone: M002 (Autonomous Life Simulation)

M002 establishes that Gloop is an autonomous living desktop companion. Time passes continuously, needs decay and recover based on wall-clock progression, autonomous decisions and moods emerge deterministically, and offline life is accurately simulated without requiring external AI APIs or cloud connections.

### Architectural Summary
- **Desktop Framework:** [Tauri 2](https://v2.tauri.app/) (Rust native backend)
- **Frontend Stack:** React 19, TypeScript, Vite
- **Renderer:** [PixiJS 8](https://pixijs.com/) (Procedural vector rendering reacting to moods and states)
- **Pure Simulation Engine:** Deterministic, testable simulation core (`src/simulation/`) with wall-clock authority, 32-bit seeded PRNG, utility-based autonomous decision making, and analytical $O(1)$ offline catch-up
- **Local Persistence:** SQLite via `@tauri-apps/plugin-sql` storing pet profiles, durable simulation state (`pet_state`), settings, and private life event timeline (`pet_life_events`)
- **Care & Status View:** Dedicated interactive view inside companion popup for monitoring needs (Satiety, Energy, Fun, Social) and triggering manual care actions (Feed, Pet, Play, Poke, Sleep/Wake)
- **Public Species Brain:** Version-controlled identity (`brain/species/identity.json`), life blueprint (`brain/species/life.json`), and reaction packs (`brain/species/reactions.json`)

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