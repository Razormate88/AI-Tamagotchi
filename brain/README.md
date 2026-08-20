# AI-Tamagotchi Species Brain

The `brain/` directory contains the **PUBLIC, VERSION-CONTROLLED SPECIES BRAIN**.

## Core Architectural Principle

This directory stores definitions, lore, archetypes, and templates that are shared across all instances of the application and distributed openly through Git.

### What Belongs in `brain/` (Public / Git)
- Species identity and biology/form definitions (`species/*.json`)
- JSON schemas validating species data (`schema/*.json`)
- Behavioral state machines and archetypes
- Evolutionary rules and unlockable paths
- Dialogue prompt templates and base vocabulary
- Shared global lore and item definitions

### What NEVER Belongs in `brain/` (Private / Local Only)
- Owner chat logs or conversation transcripts
- Learned episodic facts or personal user information
- Local pet memory graphs or embeddings
- API keys, provider credentials, or machine identifiers
- OS activity logs or window focus records
- Screenshots or media captures

All private runtime data is strictly stored in local user application-data storage (via SQLite in `app_data_dir`) and must never be committed to Git.
