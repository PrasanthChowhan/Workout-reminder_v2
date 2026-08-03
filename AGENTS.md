# Agent Instructions

Welcome to the Workout & Break Reminder repository. Below are the commands and coding standards you must follow.

## Build and Run Commands

- **Run Dev Server**: `npm run tauri dev`
- **Install Dependencies**: `npm install`
- **Build Production App**: `npm run tauri build`
- **Rust Backend Cargo Build**: `cargo build` (inside `src-tauri/`)

## Coding Guidelines

- **Frontend Tech Stack**: React + Vite + CSS Modules (Vanilla CSS scoped via `*.module.css` files, no Tailwind CSS framework for production files). Keep `src/styles.css` minimal (global variables, resets, core active-break-screen layout, and headers/footers). All component-specific styles should go into `.module.css` files co-located with their components.
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

## Dynamic Metadata Architecture

We support a type-flexible JSON metadata extension on core models (`ActiveRecallCard`, `Stretch`, `PhysicalTrack`) via `metadata: Option<serde_json::Value>` to support UI prototyping without rigid schema migrations.
- **Merge & Persistence**: Updates are merged recursively in [`state.rs`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/src-tauri/src/core/state.rs) and persisted to disk via Tauri commands in [`data_cmds.rs`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/src-tauri/src/commands/data_cmds.rs).


