# 5. Environment Isolation for Development vs Production

* Status: accepted
* Date: 2026-08-14

## Context

During development and local testing of the application, running local builds could overwrite or corrupt the user's personal SQLite database, WebView cache/local storage, and autostart registries because both dev and production builds shared the same app identifier (`com.prash.kodon`) and product name (`Kodon`).

As the application moves closer to public releases, it is critical to ensure that local development does not interfere with production user data, and that development builds are visually and behaviorally isolated.

## Decision

We will isolate the development and production environments at the operating system level:

1. **Development Configuration Overrides**:
   We introduced a dedicated [`src-tauri/tauri.conf.dev.json`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/src-tauri/tauri.conf.dev.json) which defines dev-specific overrides:
   - `productName` is set to `"Kodon Dev"`.
   - `identifier` is set to `"com.prash.kodon.dev"`.
   - `icon` maps to a grayscaled version of the icons in [`src-tauri/icons-dev/`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/src-tauri/icons-dev/).

2. **Unified Dev Script**:
   We added `"tauri:dev": "tauri dev --config src-tauri/tauri.conf.dev.json"` in [`package.json`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/package.json). This runs `tauri dev` and tells Tauri to merge the dev overrides into `tauri.conf.json`, cleanly segregating AppData paths, WebView caches, and product metadata.

3. **Isolated Autostart Entries**:
   We modified the autostart logic in [`src-tauri/src/utils/fs.rs`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/src-tauri/src/utils/fs.rs) using `#[cfg(debug_assertions)]` to ensure registry entries (`WorkoutReminderDev`), macOS LaunchAgents (`com.workoutreminder.app.dev`), and Linux desktop files (`workout-reminder-dev.desktop`) use distinct names during development runs.

## Consequences

* **Positive**: Local development runs can now be executed concurrently alongside the installed production application.
* **Positive**: The SQLite databases are isolated (e.g. `...\AppData\Roaming\com.prash.kodon.dev\workout_data.sqlite` vs `...\AppData\Roaming\com.prash.kodon\workout_data.sqlite`), eliminating schema conflicts and data corruption.
* **Positive**: The application taskbar and tray icons for development are grayscaled, making it instantly clear to the developer which window is the dev instance.
* **Negative**: Requires launching the dev server with `npm run tauri:dev` instead of a plain `npm run tauri dev` or `tauri dev` command.
