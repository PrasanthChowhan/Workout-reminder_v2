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
│       ├── TracksTab.jsx            # Track orchestrator (<200 lines)
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
