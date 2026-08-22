# 6. Handling Native Window Close During Active Breaks

* Status: accepted
* Date: 2026-08-22

## Context

When a user closed the active break overlay using `Alt + F4` or another OS-level close mechanism, the main window would intercept the `CloseRequested` event and hide the window. However, because this was decoupled from the backend break lifecycle, the backend state remained paused and in an active-break overlay state. As a result, the timer would not resume and future reminders would stop indefinitely until the user manually reopened the window and completed the break.

We needed a way to treat OS-level closes during active breaks as skips, ensuring the timer resumes reliably without depending on frontend availability or responsive IPC callbacks.

## Decision

We will handle the native window close event authoritatively in the Rust backend:

1. **Backend-First State Transition**:
   In [`src-tauri/src/lib.rs`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/src-tauri/src/lib.rs), the `CloseRequested` window event handler will inspect whether a break overlay is currently active by querying `AppState::current_break_state`.
   - If active, it will prevent native destruction, spawn an asynchronous task to run `AppState::complete_break_logic("skipped: os_close", None, None)`, close the break overlay UI styling, and emit a post-transition `"break-completed"` event.
   - If not active (e.g. Dashboard or Settings is closed), it will fallback to the default behavior of simply hiding the window.

2. **Idempotency Guard**:
   In [`src-tauri/src/core/state.rs`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/src-tauri/src/core/state.rs), `AppState::complete_break_logic` will check if `current_break_state` is already `None` at the start of the function and return early. This prevents race conditions between the frontend skip buttons and the backend window event listener from logging multiple skip events, repeating resets, or causing panic.

3. **Frontend Synchronization**:
   In [`src/App.jsx`](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/src/App.jsx), React registers a listener for `"break-completed"` event. Upon receipt, React resets its local UI overlay states (`showAnswer`, `showSkipReasonModal`) and triggers the pre-loading for the next break content (`triggerBreak()`) without triggering another backend invocation.

## Consequences

* **Positive**: The break overlay close request reliably resumes the timer and logs the skip reason under `os_close`.
* **Positive**: Timer recovery is independent of the frontend React event loop/IPC execution order, eliminating stale active break state freezes.
* **Positive**: Strict idempotency prevents race conditions between simultaneous UI clicks and native close actions.
* **Negative**: The native close event is forced to execute asynchronously because the Tauri event loop handler is synchronous while database logging/transition state runs asynchronously, requiring state verification inside the task.
