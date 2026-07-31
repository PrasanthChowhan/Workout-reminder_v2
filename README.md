# Workout & Break Reminder (Cognitive Companion)

A lightweight native desktop application (**Tauri v2 + Rust + React + Vite + Vanilla CSS**) designed as a cognitive companion for software engineers. It balances eye-health micro-breaks, physical stretch intervals, on-demand refocus exercises, and flashcard learning directly inside your flow state.

---

## 🎨 Design System: Obsidian Kinetic
Adheres to a custom Blvck/Charcoal styling system:
- **Surface Background**: Obsidian Black (`#121414`)
- **Primary Interactive Accents**: Ignition Orange (`#ff5c00`)
- **Success & Progress Telemetry**: Terminal Green (`#00e639`)
- **Geometry**: Approachable rounded-pill buttons, borders, and modal containers.

---

## 🚀 Core Features

### 1. Dual-Break Rhythm Cycles
- **Micro-Breaks (Every 20 mins for 20s)**: Eye-health break (following the 20-20-20 rule). The screen dims to absolute black with zero cognitive distractions.
- **Active Breaks (Every 50 mins for 5 mins)**: Physical movement stretching alongside active learning flashcards.
- **On-Demand "Refocus" Break (`Ctrl + Alt + R`)**: Global keyboard shortcut to summon an instant 5-minute rubber-ducking reflection overlay when stuck.

### 2. Category-Based Customization (Settings)
Fully integrated, tabbed settings console built into the overlay dashboard to edit configuration parameters:
- **Timers**: Set custom intervals and durations for breaks.
- **Recall Cards**: View, add, or delete flashcard decks (category, question, answer).
- **Reflection Prompts**: Manage high-level project alignment questions.
- **Stretches**: Edit physical resets (name, instructions, durations).

### 3. Dynamic System Tray Settings
- Right-click menu from the taskbar system tray:
  - **Show Dashboard**: Access the application interface.
  - **Pause/Resume Timer**: Toggles background timer ticking. The tray item text updates dynamically to reflect state changes.
  - **Trigger Refocus**: SUMMONS the refocus prompt instantly.
  - **Settings**: Focuses the window and opens the configuration dashboard directly.
  - **Quit**: Exit cleanly.

### 4. Interactive Skip Logging
- The **"Didn't Do"** skip button requires a **2-second press-and-hold** with a smooth orange loading transition to prevent accidental bypasses.
- Skipping prompts the user for a **Skip Reason** (with quick-select options like *Flow State*, *In a Meeting*, *Urgent Code Fix*) which logs the reason before returning to work.

---

## 🛠️ Build & Development Commands

Initialize node dependencies:
```bash
npm install
```

### Dev Mode (Auto Reloading)
Launches the dev server and the desktop client:
```bash
npm run tauri dev
```

### Build Production Releases
Compiles the Rust binaries and optimization assets:
```bash
npm run tauri build
```

### Internal Testing Checks
Run local compilation checks inside the Tauri directory:
```bash
cd src-tauri
cargo check
```

---

## 📂 Architecture
- **Rust Backend**: Tracks background timers via tokio threads, manages application configuration files (`config.json`), handles global keybind bindings (`tauri-plugin-global-shortcut`), and drives OS window manipulation.
- **Frontend SPA**: Built with React and styled with custom Vanilla CSS. Subscribes to backend events and exposes user inputs via Tauri commands.
