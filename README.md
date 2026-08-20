# AI-Tamagotchi

AI-Tamagotchi is a persistent, intelligent desktop companion application. Rather than running in a standard web browser or dashboard window, the creature lives directly on your desktop canvas with transparent surroundings, natural physics, autonomous behaviors, and durable local persistence.

---

## Current Milestone: M001 (Desktop Creature Foundation)

M001 establishes the native desktop host, hardware-accelerated 2D rendering pipeline, window management, persistence layer, and the public species brain seed.

### Architectural Summary
- **Desktop Framework:** [Tauri 2](https://v2.tauri.app/) (Rust native backend)
- **Frontend Stack:** React 19, TypeScript, Vite
- **Renderer:** [PixiJS 8](https://pixijs.com/) (Hardware-accelerated 2D canvas with WebGL and alpha transparency)
- **Local Persistence:** SQLite via `@tauri-apps/plugin-sql` storing pet profiles and settings in the local OS application data directory
- **Desktop Management:** Native system tray, single instance lock (`tauri-plugin-single-instance`), window state memory (`tauri-plugin-window-state`), and launch-at-startup (`tauri-plugin-autostart`)
- **Public Species Brain:** Version-controlled JSON schemas and species identities in `brain/`

---

## The Public Brain vs. Private Memory Rule

A foundational architectural rule governs this repository:

1. **PUBLIC / VERSION-CONTROLLED (`brain/`, `src/`):**
   - Species identities, genetics, and visual baselines (e.g. `brain/species/identity.json`)
   - JSON Schemas validating species definitions (`brain/schema/`)
   - Behavioral state machines, archetypes, and lore
   - Prompt blueprints and shared game definitions

2. **PRIVATE / LOCAL ONLY (`%APPDATA%`, `~/.config` via SQLite):**
   - Owner conversations and episodic chat logs
   - Learned personal facts and relationship bonds
   - Machine identifiers, credentials, and API tokens
   - Local database records (`tamagotchi.db`)

*Under no circumstances is private owner state or local memory committed to Git.* See [docs/architecture/privacy-boundary.md](docs/architecture/privacy-boundary.md) for the full contract.

---

## Branch Relationship to `feature/creature-v0`

`feature/creature-v0` contains the historical, monolithic Gloop Chaos prototype. It remains preserved, untouched, and unmerged in the repository history as reference material. The production application on `foundation/desktop-m001` introduces the clean, modular desktop architecture.

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

---

## Current M001 Limitations

- Visual placeholder: Gloop is rendered procedurally via PixiJS 8 vector scaffolding (production artwork, spritesheets, and skeletal meshes arrive in later milestones).
- AI Brain Simulation: LLM dialogue and autonomous episodic memory systems are scheduled for subsequent milestones (M002+). M001 focuses strictly on native desktop scaffolding, rendering, interaction, and persistence.

---

## Manual M001 Verification Steps

1. **Launch:** Run `npm run tauri dev`. Verify a transparent, frameless pet window appears on screen without opaque rectangular borders or window chrome.
2. **Animation:** Observe Gloop's idle breathing (gentle bobbing and squash-stretch) and periodic eye blinks.
3. **Hover & Click:** Move the mouse over Gloop to observe the hover reaction (perked posture and open expression). Click Gloop to trigger a squash-bounce spring reaction and floating reaction emote.
4. **Dragging:** Press and hold the primary mouse button on Gloop and drag past 5 pixels. Verify the native window moves fluidly across the desktop without triggering a false click.
5. **Context Menu:** Right-click Gloop to open the custom companion menu. Verify:
   - **Always on Top:** Toggling pins/unpins the companion above other desktop windows.
   - **Size Presets:** Selecting *Tiny (140px)*, *Small (180px)*, *Medium (220px)*, or *Large (300px)* smoothly resizes the native window.
   - **Launch at Startup:** Toggles OS autostart preference.
   - **Hide Pet:** Hides the window to the tray.
   - **About:** Displays species DNA (`gloop`) and pet profile details.
   - **Dismiss:** Pressing `Esc` or clicking outside cleanly closes the menu.
6. **System Tray:** Open the system tray icon to verify *Show Pet*, *Hide Pet*, *Always on Top*, *Reset Window Position*, and *Quit AI Tamagotchi*.
7. **Single Instance:** Attempt to launch a second instance of the application; verify it focuses the existing instance rather than opening a second pet.
8. **Position & Identity Persistence:** Move/resize Gloop and restart the application. Verify window location, dimensions, and pet profile data (`Gloop` seeded from `brain/species/identity.json`) survive restart.
9. **Reset Window Position:** Move Gloop near the screen edge and select *Reset Window Position* from the tray or context menu. Verify the pet returns to a safe visible area.