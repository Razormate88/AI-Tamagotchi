# M001: Desktop Creature Foundation Architecture

## 1. Architectural Philosophy

AI-Tamagotchi is built as a lightweight, persistent desktop companion. Unlike traditional applications that run in standard rectangular windows with title bars and thick frames, AI-Tamagotchi lives directly on the user's desktop canvas.

To achieve maximum performance, crisp 2D animation, rock-solid persistence, and low system resource overhead, M001 establishes five core architectural tiers:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Native Desktop Host (Tauri 2 / Rust)                    │
│    - Frameless, transparent, undecorated window             │
│    - Native system tray & menu integration                  │
│    - Window state recovery & safe multi-monitor positioning │
│    - Single instance locking                                │
│    - OS Autostart plugin management                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ IPC / Tauri API
┌──────────────────────────────▼──────────────────────────────┐
│ 2. Desktop Orchestration Layer (TypeScript)                 │
│    - Window drag threshold detection                        │
│    - Size preset coordination (Tiny / Small / Med / Large)  │
│    - Companion context menu & tray synchronization          │
│    - Reduced motion & accessibility hooks                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Creature Presentation Tier (PixiJS 8 / WebGL)            │
│    - Hardware-accelerated 2D canvas with alpha transparency │
│    - Encapsulated procedural animation state (bob, blink)   │
│    - Interactive hover & squish physics reactions           │
│    - Responsive scaling across window resize                │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 4. Persistence & Settings Service (SQLite via Tauri SQL)    │
│    - Migration-managed schema in local app data             │
│    - `pet_profile` (stable ID, species ID, name, last seen) │
│    - `app_settings` (key-value store for preferences)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 5. Public Species Brain (Version-Controlled Data)           │
│    - Canonical species identity blueprint (`identity.json`) │
│    - JSON schema definitions for validation                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout & Module Responsibilities

### Frontend (`src/`)
- **`app/`**: Root application composition, initialization lifecycle, providers, and global error boundaries.
- **`components/`**: Clean UI elements (translucent companion context menu, about panel, reaction bubbles).
- **`creature/`**: PixiJS 8 renderer, procedural Gloop placeholder graphics, animation timers, squash/stretch physics.
- **`desktop/`**: Window interaction handlers (drag threshold, size presets, screen safety bounds, tray event listeners).
- **`persistence/`**: SQLite database initialization, migration executor, profile and settings repositories.
- **`settings/`**: Strongly typed SettingsService abstraction decoupling UI from raw SQL queries.
- **`styles/`**: Window transparency resets, translucent glassmorphic theme definitions, CSS utility classes.
- **`types/`**: TypeScript interfaces for pet profiles, settings, window state, species blueprints.

### Native Backend (`src-tauri/`)
- **`src/main.rs` & `src/lib.rs`**: Application entry point, plugin registrations, capability validation.
- **`src/tray.rs`**: Native system tray menu builder and event router.
- **`src/commands.rs`**: Safe desktop window commands (e.g. `reset_window_position` with monitor geometry awareness).
- **`capabilities/default.json`**: Least-privilege Tauri 2 capability specification.

### Public Brain (`brain/`)
- **`schema/`**: JSON Schemas for validating species and behavioral definitions.
- **`species/`**: Version-controlled public species data (starting with `identity.json` for Gloop).

---

## 3. Key Architectural Decisions

### 1. Transparent Frameless Window
- Configured in Tauri 2 with `transparent: true`, `decorations: false`, and `shadow: false` (to prevent Windows DWM from rendering rectangular shadows on transparent webviews).
- Root HTML/body elements have `background: transparent; overflow: hidden;`.

### 2. Native Window Dragging vs Clicks
- Mouse interaction uses a pointer movement threshold (6px).
- If the primary mouse button is pressed and dragged beyond the threshold, native `appWindow.startDragging()` is initiated.
- If released within the threshold, a click reaction is triggered on the creature.
- This ensures fluid native window movement without sacrificing interactive pet clicks.

### 3. PixiJS 8 Creature Canvas
- Uses PixiJS 8 WebGL/WebGPU renderer with `backgroundAlpha: 0`.
- All animation state (idle breathing sine wave, blink timer, squish scale) is contained in the creature rendering loop rather than triggering React re-renders.

### 4. Single-Instance & System Tray
- `tauri-plugin-single-instance` ensures only one pet instance runs at a time. Launching a second copy brings the existing pet to focus.
- System tray provides complete lifecycle control (Show/Hide pet, Always on Top, Startup, Reset Position, Quit).

### 5. Migration-Backed SQLite Storage
- Built on `tauri-plugin-sql` storing data in the user's OS application directory.
- `pet_profile` guarantees a persistent pet identity seeded from the public species brain on first boot and maintained across reboots.
