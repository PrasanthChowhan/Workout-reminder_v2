---

title: "feat: Dynamic Schema Extension for Local File DBs (JSON)"
status: done
created: 2026-08-04
updated: 2026-08-04
type: feat
depth: deep
labels: [architecture, rust, tauri, state-management]

---

# Dynamic Schema Extension for Local File DBs (JSON)

## Summary

This feature introduces a structured `metadata` attribute (via `serde_json::Value`) to our local file-based databases (e.g., `flashcards_db.json`, `physical_tracks.json`). It provides a safe, type-flexible "escape hatch" in the Rust backend to store user-specific attributes or emerging feature data without breaking serialization or requiring immediate, rigid struct updates for every minor addition.

---

## Problem Frame

### Current state

* The backend relies on strict Rust `struct` definitions serialized/deserialized to local `.json` files via `serde`.
* If an older client reads a newer local JSON file (or vice versa), strict parsing can fail, wiping or ignoring user data.
* Testing new frontend features (like adding a `difficulty_multiplier` to active recall cards) requires touching core Rust state, recompiling the backend, and writing local migration scripts.

### User pain

* The development loop is slowed down by rigid backend schema requirements for UI-only experimental features.
* Users risk local data loss if a strictly-typed Rust parsing operation fails on a missing field.

### Why now

* As the application expands its Active Break routines (workouts, active recall), we need the ability to iterate on track specifications and flashcard metadata rapidly without triggering a full backend schema rewrite.

---

## Goals

* Allow arbitrary, schemaless key-value data to be saved alongside core entities in local JSON files.
* Ensure type safety at the boundaries: Rust treats it as a flexible `Value`, and the React frontend enforces the shape.
* Strictly adhere to backend constraints: **no `.unwrap()` calls**, all operations handled via `Result`.
* Keep Tauri `invoke` commands lean by handling all file I/O and JSON merging inside `AppState`.

## Non-goals

* Implementing a full embedded SQL database (e.g., SQLite) for now; we are extending the existing local file I/O architecture.
* Cloud synchronization or remote API fetching.

---

## Requirements

* **R1.** Core Rust structs (e.g., `Flashcard`, `PhysicalTrack`) must receive a `metadata: Option<serde_json::Value>` field.
* **R2.** The Rust backend must gracefully deserialize legacy files that lack this field (defaulting to `None` or `{}`).
* **R3.** Tauri invoke commands must accept payload updates, delegating the deep-merge logic to `src-tauri/src/core/state.rs`.
* **R4.** Any file writing failures must be propagated to the frontend using `?` operators and structured Tauri Error types, strictly avoiding `.unwrap()`.
* **R5.** The React frontend must type-cast the metadata payload into a strictly defined interface before rendering UI overlays.

---

## Success Criteria

* Frontend engineers can add a new metadata attribute to a flashcard or workout track purely in React, and the Rust backend will successfully persist it to disk.
* App startup and file I/O operations execute without thread blocking or panics.
* Existing local `flashcards_db.json` files parse perfectly without requiring a local migration script.

---

## Key Technical Decisions

* **`serde_json::Value` over `HashMap<String, String>**` — Using `Value` allows the frontend to store nested JSON objects, booleans, and arrays (e.g., a list of track visual asset paths) without converting everything to strings.
* **`#[serde(default)]` annotation** — Applying this macro ensures that older local config files deserialize cleanly without crashing the Tauri backend on application startup.
* **React Frontend as the Source of Truth for Shape** — Rust will act as a dumb, safe pipe for the `metadata` object. The React SPA will use structural typing to validate the keys before rendering.
* **Atomic Writes** — File saves will write to a `.tmp` file first and then rename it to prevent data corruption if the app is closed mid-save.

---

## Alternatives Considered

### Option A — Embedded SQLite (`rusqlite` or `sqlx`)

* Pros: True relational querying, fast indexing.
* Cons: Overkill for simple configuration and flashcard lists. Increases binary size and requires managing local database connection pools.
* Rejected because: The current architecture utilizes local JSON/Markdown file I/O, which is sufficient and highly portable for this scale.

---

## High-Level Design

### Core model (Rust)

```rust
// src-tauri/src/core/models.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Flashcard {
    pub id: String,
    pub question: String,
    pub answer: String,
    pub tags: Vec<String>,
    
    // Flexible extension payload
    #[serde(default)]
    pub metadata: Option<Value>, 
}

```

### Data flow

```mermaid
flowchart LR
    A[React App / Vite] -->|Tauri IPC invoke| B[Tauri Command]
    B -->|Delegates to| C[core::state::AppState]
    C -->|Deep Merge json_value| D[Update In-Memory State]
    D -->|Tokio Async Write| E[Local File System (JSON)]

```

### Component / module architecture

```text
src-tauri/
├── src/
│   ├── commands/
│   │   └── data_cmds.rs      (Lean IPC bridge)
│   ├── core/
│   │   ├── state.rs          (Holds Mutex<AppState> and JSON merge logic)
│   │   ├── models.rs         (Updated with metadata fields)
│   │   └── error.rs          (Custom Result/Error types for UI)
src/
├── components/
│   └── ActiveBreak/
│       └── Flashcard.jsx     (Reads metadata for UI rendering)

```

---

## UX Behavior

### Default

* Invisible to the user. The Active Break UI (`Left:` physical tracks, `Right:` flashcards) continues to render using the Obsidian Kinetic theme.
* Unrecognized metadata fields are ignored by the frontend.

### Edge states

* **File I/O Corruption:** If a JSON file becomes corrupted, the Rust backend must capture the parse error (via `?`) and send a localized error message to the React UI, rather than panicking.
* **Type Mismatch:** If the frontend expects `metadata.difficulty` to be an integer but it reads as a string, React will handle the fallback.

---

## Scope Boundaries

### In scope

* Updating Rust structs for `Flashcard`, `PhysicalTrack`, and `WorkoutSplit`.
* Updating `core::state.rs` file writing logic to support partial JSON updates.
* Tauri commands to fetch/update these specific entities.

### Out of scope

* Refocus Journals (`/journals/*.md`) — these will remain pure Markdown logs, not JSON structures.

---

## Implementation Units

### U1. Rust Struct & State Updates

**Goal:** Modify backend data structures to safely parse dynamic data.

**Requirements:** R1, R2

**Files:**

* `src-tauri/src/core/models.rs`
* `src-tauri/src/core/state.rs`

**Approach:**

1. Add `#[serde(default)] pub metadata: Option<serde_json::Value>` to target structs.
2. Ensure `AppState` load methods gracefully handle missing files or fields.
3. Verify no `.unwrap()` exists in the serialization/deserialization pathways. Return custom `AppError` on `io::Error`.

---

### U2. Tauri Commands (Lean Bridge)

**Goal:** Provide the IPC endpoints for the frontend without leaking business logic.

**Requirements:** R3, R4

**Files:**

* `src-tauri/src/commands/data_cmds.rs`

**Approach:**

1. Create `#[tauri::command]` functions (e.g., `update_flashcard_metadata`).
2. Pass the `tauri::State<'_, AppState>` into the command.
3. Immediately delegate the execution to `app_state.update_metadata(...)` and return a `Result<(), String>`.

---

### U3. React Frontend Integration

**Goal:** Utilize the new flexible payload in the Vite SPA.

**Requirements:** R5

**Files:**

* `src/App.jsx`
* `src/components/ActiveBreak.jsx`

**Approach:**

1. Define the expected metadata interfaces in frontend JSDoc/TypeScript.
2. Update Tauri `invoke` calls to pass the `metadata` object when mutating a flashcard or track.
3. Apply standard Vanilla CSS Modules (`*.module.css`) and strictly follow the Obsidian Kinetic Design System (8px grid, tabular numbers, Geist/JetBrains Mono typography) for any new UI elements driven by the metadata.

---

## Testing Strategy

### Unit (Rust)

* Run `cargo test` on deserialization logic. Provide a legacy JSON string (without metadata) and ensure it parses successfully into the struct with `metadata: None`.
* Ensure JSON serialization accurately writes the `serde_json::Value` to string.

### Integration (Tauri/React)

* Run `npm run tauri dev`.
* Add a new flashcard with custom metadata (e.g., `{"difficulty": 2}`).
* Restart the app and verify the state persists and loads correctly.

### Regression

* Validate that the background timer loops (tokio threads) are not blocked during file I/O operations.

---

## Performance Considerations

* **File I/O Overhead:** Deep-merging large JSON objects and rewriting the entire file to disk on every micro-update is inefficient.
* **Mitigation:** Write operations in `AppState` should be debounced, or file writes should happen asynchronously (`tokio::fs`) outside of the main UI thread to avoid stuttering the timer interfaces.

---

## Telemetry / Debugging

* **Error Propagation:** Log all `serde_json::Error` and `std::io::Error` instances in the Rust backend using the `log` crate before passing them up to the React frontend.
* **No panics:** Strict adherence to the `No .unwrap()` constraint ensures that file I/O failures degrade gracefully, displaying a Terminal Green (`#00e639`) or Ignition Orange (`#ff5c00`) toast notification in the UI rather than crashing the desktop process.

---

## Rollout Plan

### Phase 1

* Merge Rust backend struct updates. `cargo check` and `cargo build` to verify strict correctness.

### Phase 2

* Implement frontend UI logic utilizing the new metadata fields.
* Test full loop locally using `npm run tauri dev`.

### Phase 3

* Export dev issues via `create_dev_issue` command.
* Compile production binary (`npm run tauri build`).

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| **Data Corruption during Save** | Use atomic writes. Save to a `temp.json` file first, then atomically rename it to `flashcards_db.json` via OS-level rename commands. |
| **Main Thread Blocking** | Perform all file writing asynchronously using `tokio::fs` to ensure the desktop window and timer loops never stutter. |
| **Type Drift in Frontend** | Since Rust acts as a blind passthrough for the JSON payload, maintain strict frontend interface definitions (JSDoc/PropTypes) before rendering data. |

---

## Open Questions

* Should we implement an automated debouncer for `flashcards_db.json` writes if users are rapidly reviewing and updating cards during an Active Break?
* At what file size limit (e.g., > 50,000 flashcards) do we plan to graduate from local JSON files to a formal SQLite embedded database?

---

## Sources / References

* `CONTEXT.md` / `DESIGN.md` / `AGENTS.md` (Project Local Architecture Guidelines)
* [Tauri v2 IPC & Commands Documentation](https://v2.tauri.app/concept/inter-process-communication/)
* [Serde JSON `Value` Type](https://docs.rs/serde_json/latest/serde_json/enum.Value.html)
* [Tokio Asynchronous File I/O](https://docs.rs/tokio/latest/tokio/fs/index.html)