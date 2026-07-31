# 2. Async Window Manipulation from System Tray Events

* Status: accepted
* Date: 2026-08-01

## Context

In Tauri v2, the `on_menu_event` for system tray menus on Windows runs synchronously on the main UI/event loop thread. When a menu item (such as "Trigger Refocus") is clicked, the OS modal menu loop is still active. Performing complex and heavy window state modifications (such as calling `set_decorations`, `set_fullscreen`, and `set_always_on_top` in rapid succession) synchronously inside this event handler blocks the message loop, causing the application to hang, deadlock, or crash.

## Decision

All window management, visibility, and state operations triggered inside system tray event handlers (`on_menu_event`) must be run asynchronously by spawning them on the Tauri async runtime:
```rust
tauri::async_runtime::spawn(async move {
    // Perform window state modifications here
});
```

## Consequences

* **Positive**: Resolves crashes and deadlocks by letting the tray event callback return immediately and allow the tray menu to close before the window is manipulated.
* **Positive**: Smooth transitions when shifting between normal desktop mode and fullscreen overlays.
* **Negative**: Introduces a minor level of concurrency; developers must ensure that concurrent state updates do not conflict.
