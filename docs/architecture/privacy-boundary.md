# Privacy Boundary & Memory Isolation Contract

## 1. Executive Summary

AI-Tamagotchi is designed to become a deeply personalized, persistent desktop companion. Because future milestones involve local episodic memory, conversational awareness, and adaptive behavior, the application enforces an absolute, architectural separation between **Public Species Definitions** and **Private Local Memories**.

This document defines the strict boundary that must be respected across all milestones.

---

## 2. Public vs Private Boundary Contract

```
┌─────────────────────────────────────────────────────────────┐
│                    GIT REPOSITORY (Public)                  │
│                                                             │
│  src/           Application Logic & Native UI Scaffolding   │
│  src-tauri/     Rust Desktop Host, Window & Tray Systems    │
│  brain/         Species DNA, Schemas, Shared Lore & Rules   │
│                 - schema/species.schema.json                │
│                 - species/identity.json (e.g. Gloop DNA)    │
└─────────────────────────────────────────────────────────────┘
                              │
                    [ Build & Release ]
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               LOCAL USER MACHINE (Private Storage)          │
│                                                             │
│  %APPDATA%/AI-Tamagotchi/ (Windows)                         │
│  ~/Library/Application Support/AI-Tamagotchi/ (macOS)       │
│  ~/.config/AI-Tamagotchi/ (Linux)                           │
│                                                             │
│  ├── tamagotchi.db (SQLite)                                 │
│  │   ├── pet_profile (Instance ID, Local Name, Last Seen)   │
│  │   ├── app_settings (UI & Native Preferences)             │
│  │   └── [Future: episodic_memory, relationship, dialogue]  │
│  └── storage/ (Local vector embeddings, cache, credentials) │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Strict Classification

### Public / Version-Controlled (Git Repository)
The following assets are distributed with the codebase and are identical for every player:
- **Species Identifiers & Taxonomy:** Core species blueprints, canonical default names, baseline temperament descriptions.
- **Behavioral Schemas:** State machines, idle animations, reaction definitions, emotion matrices.
- **Shared Lore & Items:** Pre-authored items, minigame scripts, global worldbuilding.
- **Prompt Blueprints:** Static prompt structures and system templates.

### Private / Local Only (User Application Data Storage)
The following information must NEVER be committed to Git or synced to public remotes:
- **Owner Identity & Chat:** Any dialogue between the owner and the companion.
- **Learned Facts:** Personal notes, owner name, schedule hints, user preferences.
- **Relationship Matrix:** Bond scores, affection levels, personal milestones.
- **System Telemetry / Logs:** Local diagnostic logs, machine identifiers, window titles.
- **Credentials & Keys:** API tokens (OpenAI, Anthropic, Gemini, local LLMs), auth secrets.
- **Local SQLite Database:** `tamagotchi.db` and any associated WAL / SHM files.

---

## 4. Implementation Rules

1. **Storage Location:** All persistent state is saved via the official Tauri SQL plugin into the OS standard application data directory (`sqlite:tamagotchi.db`). No database file is ever created inside the project repository.
2. **Git Hygiene:** The project `.gitignore` includes aggressive filters for `*.db`, `*.sqlite`, `*.log`, `*.memory`, `.env*`, and cache directories.
3. **Deterministic Seeding:** On first launch, the local database initializes `pet_profile` using public blueprints from `brain/species/identity.json`. Subsequent runs load the local record from SQLite.
4. **Security Model:** Future AI providers will be accessed either through local on-device models or user-provided keys stored in secure OS keychain/storage, never embedded in repository files.
