# Behind the Scenes: Daily Accountability Check-in

The **Daily Accountability Check-in** is an optional, user-enabled commitment device designed to prompt the user once per local calendar day with a customizable Yes/No question (default: **"Have you read the book of king?"**).

When enabled, it acts as a **blocking barrier**: the application window forces itself visible and focused on computer startup, blocking access to all other features until the user logs their daily commitment response.

---

## Technical Architecture & Lifecycle

```mermaid
flowchart TD
    AppStart[App Startup / Main Window Open] --> Check[Tauri Backend: check_daily_question_status]
    Check -->|Disabled or Answered| Dashboard[Render Normal App]
    Check -->|Enabled & Unanswered| ShowWindow[Force Show & Focus Window]
    ShowWindow --> Modal[Show Blocking Accountability Modal]
    Modal -->|Yes / No| Submit[Tauri Backend: submit_daily_question_response]
    Submit --> Persist[Insert activity_log Row]
    Persist --> Unlock[Close Modal & Unlock App]
```

### 1. Startup & Day Rollover Enforcement
* **PC Startup / Application Boot**: The Tauri backend setup hook reads the configuration during initialization. If `daily_prompt_enabled` is true, it queries the local database to see if a check-in has been logged for today's local date (`YYYY-MM-DD`). If unanswered, it immediately forces the main webview window to show (`window.show()`) and focus (`window.set_focus()`), regardless of default window visibility settings.
* **Refocus / Open Triggers**: Whenever the main window gains focus or changes visibility (e.g. opened from the system tray), the frontend checks status again with the backend. If the day rolled over since the last answer and the check-in is enabled, the blocking modal immediately overlays the interface.

### 2. Blocking Modal UI
* The overlay acts as a complete modal trap. Escape key press and clicks outside the dialog are ignored and blocked.
* The user must select **YES** or **NO**.
* The modal remains visible and locked until the response is successfully written and confirmed by the local SQLite database.

### 3. Database Persistence
Responses are persisted in the SQLite database to enable analytics, streaks, and exports:

* **Settings Storage**: The `settings` table stores `daily_prompt` (TEXT) and `daily_prompt_enabled` (INTEGER).
* **Logs Storage**: Responses are inserted into the `activity_log` table under:
  - `event_type`: `"daily_question"`
  - `occurred_at`: Unix timestamp (milliseconds)
  - `local_date`: User local date (`YYYY-MM-DD`)
  - `reference_id`: User local date (`YYYY-MM-DD`), serving as a unique constraint index to prevent duplicate logging on the same day.
  - `metadata`: JSON payload, e.g. `{"response": "yes"}` or `{"response": "no"}`.

---

## Configuration & Management
The check-in can be configured, enabled, or disabled at any time under **Settings -> General**:

* **Toggle Checkbox**: Enables or disables the check-in. Enabling prompts the user with a confirmation dialog explaining the blocking behavior.
* **Custom Question Input**: Allows customizing the prompt text displayed in the modal overlay.
