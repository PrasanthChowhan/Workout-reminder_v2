---
title: "refactor: Codebase cleanup, progressive disclosure, and anti-pattern removal"
status: proposed
created: 2026-08-04
updated: 2026-08-04
type: feat
depth: deep
owner: Prasanth
labels: [refactor, dx, architecture, p0]
---

# Codebase Refactoring & AI-Agent Optimization

## Summary

The codebase has accumulated severe technical debt from AI-generated code: god components (1,182-line `TracksTab.jsx`), 32 `.unwrap()` calls violating project rules, ~15,000 tokens of redundant documentation, duplicated SVG icons & utility functions, prop-drilled styles, dead code, and scattered context files that force AI agents to read 30K+ tokens just to understand the project. This refactoring eliminates all of these issues.

***

## Problem Frame

### Current state
- `TracksTab.jsx` is 1,182 lines handling 11 responsibilities (god component)
- `state.rs` is 655 lines with 260+ lines of hardcoded exercise data
- `timer_cmds.rs` has 15 `.unwrap()` calls and embeds business logic in Tauri commands
- 6 root-level markdown files duplicate the same break definitions, state machines, and dev commands
- AI agents waste ~15,000 tokens reading redundant context before writing a single line
- Refocus break trigger logic is copy-pasted in 3 separate Rust files

### User pain
- AI agents forget rules because context is scattered across too many files
- Every new AI session wastes time re-reading redundant documentation
- AI generates god components because there are no small, focused examples to follow
- Debugging is hard because responsibilities are tangled

### Why now
- The codebase is at a tipping point where adding any new feature requires explaining the entire architecture
- Token costs compound with every AI interaction
- The longer this debt lives, the harder it becomes to refactor

***

## Goals

- **G1.** Reduce AI context overhead from ~30K tokens to <10K tokens via progressive disclosure
- **G2.** Eliminate all god components (enforce single-responsibility; use size as a warning signal rather than a hard barrier)
- **G3.** Fix all 32 `.unwrap()` violations in Rust backend
- **G4.** Remove all code duplication (SVG icons, utility functions, break trigger logic)
- **G5.** Delete all dead code and stray files
- **G6.** Make `AGENTS.md` ultra-lean (<300 tokens) so AI agents start fast

## Non-goals

- No new features — this is purely structural
- No UI/UX changes — visual output must be identical
- No Rust API changes — Tauri command signatures stay the same
- No dependency additions

***

## Implementation Units

### Phase 1: Branch & Dead Code Cleanup (Low Risk)

#### U1. Create branch & delete dead code

**Goal:** Clean slate on a new branch; remove all dead/stray files
**Dependencies:** None

**Files:**
- `src-tauri/2` (delete)
- `src/components/ui/demo.tsx` (delete)
- `src/components/ui/player-layout.tsx` (delete)
- `src/lib/utils.js` (delete — only used by deleted `.tsx` files)

**Approach:**
1. Create `refactor/codebase-cleanup` branch
2. Delete stray `src-tauri/2` (accidental npm output)
3. Delete unused `demo.tsx` and `player-layout.tsx` (Tailwind + TypeScript, violates project rules)
4. Delete `src/lib/utils.js` (only imported by deleted files)
5. Remove dead `hideToTray()` export from `src/utils/tauri.js`
6. Remove dead `showNotify()` from `TracksTab.jsx`
7. Remove unused CSS rules (~150 lines across `TracksTab.module.css` and `PhysicalResetCard.module.css`)

---

### Phase 2: Documentation Consolidation (Medium Risk)

#### U2. Consolidate documentation into progressive-disclosure tiers

**Goal:** Reduce AI context from ~30K to <10K tokens using a 3-tier system
**Dependencies:** U1

**Tier 0 — `AGENTS.md` (<300 tokens):** Only hard rules + pointer links. AI reads this every turn.
**Tier 1 — `CONTEXT.md` (~900 tokens):** Domain glossary, state machine, architecture overview. AI reads on first task.
**Tier 2 — `docs/*`:** Deep specs, ADRs, schemas. AI reads only when working on specific areas.

**Files:**
- `AGENTS.md` (rewrite — strip to operational rules only)
- `AI-HANDOFF.md` (delete — absorbed into `CONTEXT.md`)
- `CONTEXT.md` (rewrite — single authoritative domain overview)
- `README.md` (trim — keep public-facing info only, no internal rules)
- `todo.md` (move to `docs/plans/terms-and-conditions.md`)
- `docs/plans/sqlite plan.md` (rename to `json-metadata-extension.md`)
- `docs/full_split.json` → `docs/data/full-split.json`
- `docs/kick up.json` → `docs/data/kick-up-beginner.json`
- `.agents/skills/submodule-upgrade-planner/` (delete — no submodules exist)

---

### Phase 3: Frontend Component Decomposition (High Impact)

#### U3. Extract shared UI primitives

**Goal:** Create reusable icon and modal components to eliminate duplication
**Dependencies:** U1

**Files:**
- `src/components/ui/Icons.jsx` (new — all SVG icons as named exports)
- `src/components/ui/Modal.jsx` (new — generic modal wrapper with focus trap, ESC key, ARIA)
- `src/components/ui/Modal.module.css` (new)
- `src/components/Toast.jsx` (new — extract from App.jsx)
- `src/components/Toast.module.css` (new — move from styles.css lines 294-400)

**Approach:**
1. Audit all inline SVGs → create `<Icon name="settings" />`, `<Icon name="trash" />`, etc.
2. Create `<Modal>` component with `role="dialog"`, `aria-modal`, focus trap, ESC dismiss
3. Extract toast rendering from App.jsx into `<ToastContainer>`
4. Move toast CSS from global `styles.css` to `Toast.module.css`
5. Move hold-button CSS from global `styles.css` to component-level

#### U4. Extract `getYoutubeId` to shared util

**Goal:** Remove duplicated YouTube URL parser
**Dependencies:** U1

**Files:**
- `src/utils/youtube.js` (new)
- `src/components/PhysicalResetCard.jsx` (modify — import from util)
- `src/components/EmbeddedPlayer.jsx` (modify — import from util)

#### U5. Break up TracksTab god component

**Goal:** Decompose 1,182-line god component into focused sub-components
**Dependencies:** U3

**Files:**
- `src/components/settings/TracksTab.jsx` (rewrite — orchestrator only, focused single-responsibility)
- `src/components/settings/tracks/TrackListView.jsx` (new)
- `src/components/settings/tracks/TrackListView.module.css` (new)
- `src/components/settings/tracks/TrackDetailView.jsx` (new)
- `src/components/settings/tracks/TrackDetailView.module.css` (new)
- `src/components/settings/tracks/AiWorkoutModal.jsx` (new)
- `src/components/settings/tracks/AiWorkoutModal.module.css` (new)

**Approach:**
1. Extract track list/grid view → `TrackListView`
2. Extract track detail/level inspection → `TrackDetailView`
3. Extract AI workout prompt modal (10 form inputs + response parsing) → `AiWorkoutModal`
4. Use shared `<Modal>` from U3 for all overlay dialogs
5. Remove all 35+ inline styles → move to CSS modules
6. TracksTab becomes a thin router between list and detail views

#### U6. Fix SettingsModal prop-drilling anti-pattern

**Goal:** Each settings tab imports its own CSS module
**Dependencies:** U3

**Files:**
- `src/components/settings/SettingsModal.jsx` (modify — stop drilling `styles` prop)
- `src/components/settings/CardsTab.jsx` (modify — import own styles)
- `src/components/settings/CardsTab.module.css` (new)
- `src/components/settings/PromptsTab.jsx` (modify — import own styles)
- `src/components/settings/PromptsTab.module.css` (new)
- `src/components/settings/StretchesTab.jsx` (modify — import own styles)
- `src/components/settings/StretchesTab.module.css` (new)

#### U7. Extract mock data from tauri.js

**Goal:** Remove 148 lines of embedded mock JSON
**Dependencies:** U1

**Files:**
- `src/utils/mockData.json` (new)
- `src/utils/tauri.js` (modify — import mock data)

---

### Phase 4: Rust Backend Cleanup (High Risk)

#### U8. Fix all `.unwrap()` violations

**Goal:** Replace 32 `.unwrap()` calls with proper error handling
**Dependencies:** U1

**Files:**
- `src-tauri/src/commands/config_cmds.rs` (modify — 4 unwraps)
- `src-tauri/src/commands/timer_cmds.rs` (modify — 15 unwraps)
- `src-tauri/src/core/background_loop.rs` (modify — 5 unwraps)
- `src-tauri/src/system/shortcuts.rs` (modify — 3 unwraps)
- `src-tauri/src/system/tray.rs` (modify — 5 unwraps)

**Approach:**
1. Create a Mutex lock helper: `fn lock_or_err<T>(mutex: &Mutex<T>) -> Result<MutexGuard<T>, String>`
2. Replace all `.lock().unwrap()` with `.lock().map_err(|e| e.to_string())?`
3. For non-Result contexts (tray/shortcut handlers), use `.lock().unwrap_or_else(|e| e.into_inner())`

#### U9. Extract business logic from timer_cmds.rs

**Goal:** Tauri commands become thin wrappers
**Dependencies:** U8

**Files:**
- `src-tauri/src/core/state.rs` (modify — add `get_session_data()`, `complete_break()` methods)
- `src-tauri/src/commands/timer_cmds.rs` (modify — delegate to state methods)

**Approach:**
1. Move `find_active_level()`, `is_level_excluded()` to `AppState` impl
2. Move `get_session_data` logic to `AppState::build_session_data()`
3. Move `complete_break` logic to `AppState::process_break_completion()`
4. Timer commands become 3-5 line wrappers that call state methods

#### U10. Decompose state.rs god module

**Goal:** Split 655-line file into focused modules
**Dependencies:** U9

**Files:**
- `src-tauri/src/core/models.rs` (new — all data structs)
- `src-tauri/src/core/defaults.rs` (new — default exercise/card data)
- `src-tauri/src/core/state.rs` (modify — only AppState container + methods)
- `src-tauri/src/core/mod.rs` (modify — add new module declarations)

#### U11. Deduplicate refocus break trigger

**Goal:** Single function for refocus break, called from 3 places
**Dependencies:** U8

**Files:**
- `src-tauri/src/system/window.rs` (modify — add `trigger_refocus_break()`)
- `src-tauri/src/commands/timer_cmds.rs` (modify — call shared function)
- `src-tauri/src/system/shortcuts.rs` (modify — call shared function)
- `src-tauri/src/system/tray.rs` (modify — call shared function)

#### U12. Update project identifiers

**Goal:** Replace boilerplate template names
**Dependencies:** U1

**Files:**
- `src-tauri/Cargo.toml` (modify — update name, authors)
- `src-tauri/tauri.conf.json` (modify — update productName, identifier, window title)

---

### Phase 5: Prevention Guardrails (Critical)

#### U14. Create hierarchical AGENTS.md system

**Goal:** AI agents auto-load the nearest `AGENTS.md` when working in a directory. Instead of one bloated root file, split rules by domain so each side only pays for its own context. Add ask-first boundaries, verification commands, and code snippets — not just prose.
**Dependencies:** U2

**Design: 3-tier AGENTS.md hierarchy:**

```
/AGENTS.md              ← Root: stack context, boundary rules, shared commands, doc pointers
/src/AGENTS.md          ← Frontend: React, CSS Module, component architecture rules
/src-tauri/AGENTS.md    ← Backend: Rust, Tauri commands, error handling rules
```

**Files:**
- `AGENTS.md` (rewrite — root, <300 tokens)
- `src/AGENTS.md` (new — frontend rules)
- `src-tauri/AGENTS.md` (new — backend rules, replaces `.gitignore`-level context)

---

**`/AGENTS.md` (Root — loaded every turn, must be ultra-lean):**

```markdown
# Agent Instructions

## Stack Context
Tauri v2 · Rust 1.75+ · React 18 · Vite · Vanilla CSS Modules.
DO NOT use Tailwind, Create React App, or Next.js patterns.

## Commands
- Dev: `npm run tauri dev`
- Install: `npm install`
- Build: `npm run tauri build`
- Rust check: `cd src-tauri && cargo check && cargo clippy`

## Boundary Rules (Ask First)
- RULE-A1: **Ask before** modifying `tauri.conf.json`, `package.json`, or `Cargo.toml`. Never install dependencies autonomously.
- RULE-A2: **Ask before** creating new top-level components or pages. Verify placement in `ARCHITECTURE.md` first.
- RULE-A3: **Ask before** adding new root-level documentation files. Use `docs/` or update existing files.

## Shared Rules
- RULE-D1: Never duplicate utility functions. Check `src/utils/` or existing Rust modules first.
- RULE-D2: Never duplicate information across docs. Write once, link to it.
- RULE-F1: Enforce strictly one responsibility per file. Use size (>250 lines for React, >300 lines for Rust) as a diagnostic signal to review for split, not a hard barrier.

## Key Docs (read on-demand, not every turn)
- Domain & glossary: [CONTEXT.md](CONTEXT.md)
- Design system: [DESIGN.md](DESIGN.md)
- Component map: [ARCHITECTURE.md](ARCHITECTURE.md)
- Schemas: [docs/schemas/](docs/schemas/)
- ADRs: [docs/adr/](docs/adr/)
```

---

**`/src/AGENTS.md` (Frontend — loaded only when editing `src/`):**

```markdown
# Frontend Agent Rules

## Verify After Changes
- RULE-V1: After modifying React/CSS files, run the dev server and check the browser console for errors.

## Component Architecture
- RULE-C1: One responsibility per component. Modals → own file. Lists → own file.
- RULE-C2: Never drill CSS module `styles` as props. Each component imports its own `.module.css`.
- RULE-C3: All modals must use `<Modal>` from `src/components/ui/Modal.jsx`.
- RULE-C4: Never use inline `style={{}}`. Use CSS module classes.
- RULE-C5: Use `crypto.randomUUID()` for IDs, never `Math.random()`.

## Icons (Show, Don't Tell)
- RULE-D1: Never inline SVG. Import from `src/components/ui/Icons.jsx`.

```jsx
// ✅ DO THIS:
import { TrashIcon, SettingsIcon } from '../ui/Icons';
<button><TrashIcon /></button>

// ❌ NEVER THIS:
<button><svg fill="none" height="24" ...>...</svg></button>
```

## Styling
- RULE-S1: `src/styles.css` is ONLY for CSS custom properties, resets, and grid layout.
- RULE-S2: All component styles → co-located `.module.css` files.
- RULE-S3: Follow [DESIGN.md](../DESIGN.md) — Ignition Orange accents, Terminal Green success, pill buttons.

## Where to Put New Code
- New component → `src/components/` + co-located `.module.css`
- New icon → add named export to `src/components/ui/Icons.jsx`
- New modal → own component file using `<Modal>` wrapper
- New hook → `src/hooks/`
- New utility → check `src/utils/` first, add there if new


---

**`/src-tauri/AGENTS.md` (Backend — loaded only when editing `src-tauri/`):**


# Rust Backend Agent Rules

## Verify After Changes
- RULE-V1: After modifying ANY Rust file, run `cargo check` in `src-tauri/`.
- RULE-V2: Run `cargo clippy` before concluding your turn to catch lint issues.

## Error Handling (Show, Don't Tell)
- RULE-R1: **Zero `.unwrap()` in production code.**

```rust
// ✅ DO THIS — in functions returning Result:
let config = state.config.lock().map_err(|e| e.to_string())?;

// ✅ DO THIS — in event handlers (no Result return):
let config = state.config.lock().unwrap_or_else(|e| e.into_inner());

// ❌ NEVER THIS:
let config = state.config.lock().unwrap();
```

## Tauri Commands (Show, Don't Tell)
- RULE-R2: Commands must be **thin wrappers** (≤10 lines). Business logic → `core/state.rs`.

```rust
// ✅ DO THIS:
#[tauri::command]
pub fn complete_break(
    action: String,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    state.process_break_completion(&action, &app)
}

// ❌ NEVER THIS: 50-line command with loops, conditionals, and mutex jugging
```

## Data & Modules
- RULE-R3: No hardcoded exercise/card data in `.rs` files. Use `core/defaults.rs` or JSON assets.
- RULE-R4: Never copy-paste logic across modules. Extract to `core/` or `system/` helpers.

## Where to Put New Code
- New Tauri command → thin wrapper in `commands/`, logic in `core/state.rs`
- New data struct → `core/models.rs`
- New business logic → methods on `AppState` in `core/state.rs`
- New system integration → `system/` module


---

#### U15. Create ARCHITECTURE.md with component map

**Goal:** Give AI agents a quick-reference map so they know where things live and where new code goes — without reading every file. Referenced from root `AGENTS.md`.
**Dependencies:** U3–U12

**Files:**
- `ARCHITECTURE.md` (new)

**Contents:**

# Architecture Map

## Frontend (src/)
```
src/
├── App.jsx                          # Top-level orchestrator (timer, layout, events)
├── main.jsx                         # React entry point
├── styles.css                       # ONLY: CSS variables, resets, grid layout
├── components/
│   ├── ui/
│   │   ├── Icons.jsx                # ALL SVG icons (named exports)
│   │   ├── Modal.jsx                # Shared modal (focus trap, ESC, ARIA)
│   │   └── Modal.module.css
│   ├── Toast.jsx                    # Toast notification system
│   ├── Toast.module.css
│   ├── PhysicalResetCard.jsx        # Left card: stretch/exercise display
│   ├── ActiveRecallCard.jsx         # Right card: flashcard display
│   ├── EmbeddedPlayer.jsx           # YouTube iframe player
│   ├── SkipReasonModal.jsx          # Skip reason overlay
│   └── settings/
│       ├── SettingsModal.jsx        # Settings orchestrator + tab router
│       ├── CardsTab.jsx             # Flashcard management tab
│       ├── PromptsTab.jsx           # Reflection prompts tab
│       ├── StretchesTab.jsx         # Stretch management tab
│       ├── TracksTab.jsx            # Track orchestrator (focused single-responsibility)
│       └── tracks/
│           ├── TrackListView.jsx    # Track grid/list view
│           ├── TrackDetailView.jsx  # Level inspection view
│           └── AiWorkoutModal.jsx   # AI workout generator modal
├── hooks/
│   └── useHoldToConfirm.js          # Hold-to-confirm button hook
└── utils/
    ├── tauri.js                     # Tauri IPC bridge (invoke, listen)
    ├── youtube.js                   # YouTube URL parsing
    ├── time.js                      # Time formatting
    ├── toast.js                     # Toast event dispatcher
    ├── track.js                     # Track validation
    ├── aiPrompt.js                  # AI prompt builder
    └── mockData.json                # Dev-mode mock data
```
## Backend (src-tauri/src/)
```
src-tauri/src/
├── main.rs                          # Binary entry point
├── lib.rs                           # App setup, plugins, tray, shortcuts
├── core/
│   ├── models.rs                    # All data structs (AppConfig, Stretch, etc.)
│   ├── defaults.rs                  # Default seed data (exercises, cards)
│   ├── state.rs                     # AppState container + business logic methods
│   └── background_loop.rs           # 1-second tokio timer tick loop
├── commands/
│   ├── config_cmds.rs               # Config CRUD commands (thin wrappers)
│   ├── timer_cmds.rs                # Timer/break commands (thin wrappers)
│   ├── data_cmds.rs                 # Metadata update commands (thin wrappers)
│   └── dev_cmds.rs                  # Dev issue reporter command
├── system/
│   ├── tray.rs                      # System tray menu
│   ├── shortcuts.rs                 # Global keyboard shortcuts
│   └── window.rs                    # Window helpers + trigger_refocus_break()
└── utils/
    └── fs.rs                        # File I/O, config persistence
```
## Decision Guide: Where Does New Code Go?

| I need to...                  | Put it in...                                    |
|-------------------------------|------------------------------------------------|
| Add a UI element              | `src/components/` + co-located `.module.css`   |
| Add a shared icon             | `src/components/ui/Icons.jsx` (named export)   |
| Add a modal dialog            | Own component file, wraps `<Modal>`            |
| Add a Tauri command           | Thin wrapper `commands/`, logic `core/state.rs`|
| Add a data struct             | `src-tauri/src/core/models.rs`                 |
| Add a utility function        | Check `src/utils/` first, add new file if none |
| Add documentation             | `docs/` subdirectory, link from `CONTEXT.md`   |


---

### Phase 6: Verification

#### U16. Build verification

**Goal:** Ensure everything compiles and runs
**Dependencies:** U3–U15

**Approach:**
1. Run `cargo check && cargo clippy` in `src-tauri/`
2. Run `npm run tauri dev` and visually verify the active break screen
3. Verify settings modal opens and all tabs render
4. Verify tray menu, global shortcut, and timer countdown all work

***

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| TracksTab decomposition breaks state flow | Keep state in TracksTab orchestrator, pass as props to sub-views |
| Removing CSS from styles.css breaks layout | Move styles 1:1 into modules, no style changes |
| Mutex error handling changes behavior | Use `unwrap_or_else(into_inner)` for non-Result contexts to maintain current behavior |
| Documentation consolidation loses info | Every deleted file's content verified absorbed elsewhere before deletion |
| AI ignores new rules | Rules are numbered (`RULE-F1`, `RULE-R1`, etc.) in `AGENTS.md` which is loaded every turn. `ARCHITECTURE.md` linked from `AGENTS.md` provides the map. |

***

## Open Questions

- Should `docs/reference/code.html` (Tailwind prototype) be deleted or kept with a "legacy prototype" notice?
- Should `ADR-0001` font reference be updated from `Outfit` to `Geist` to match `DESIGN.md`?
