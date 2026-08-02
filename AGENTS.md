# Agent Instructions

Welcome to the Workout & Break Reminder repository. Below are the commands and coding standards you must follow.

## Build and Run Commands

- **Run Dev Server**: `npm run tauri dev`
- **Install Dependencies**: `npm install`
- **Build Production App**: `npm run tauri build`
- **Rust Backend Cargo Build**: `cargo build` (inside `src-tauri/`)

## Coding Guidelines

- **Frontend Tech Stack**: React + Vite + Vanilla CSS (no Tailwind CSS framework for production files).
- **Design Alignment**: Adhere strictly to the design system in [DESIGN.md](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/DESIGN.md) (Obsidian Kinetic: Ignition Orange accents, Terminal Green success states, and rounded-pill buttons).
- **Rust Guidelines**:
  - Keep Tauri commands clean; delegate complex timer or state logic to helper modules.
  - Follow idiomatic Rust code styles, handling all errors gracefully (avoid `.unwrap()`).
- **Data Schemas**:
  - Check [docs/schemas/](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/docs/schemas) for existing JSON schemas (e.g. [`training-program.schema.json`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/docs/schemas/training-program.schema.json)) when editing or creating workout configs or split programs to ensure structural consistency.

## Agent skills

### Issue tracker

Issues and PRDs for this repo live as GitHub issues. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context repository layout. See `docs/agents/domain.md`.
