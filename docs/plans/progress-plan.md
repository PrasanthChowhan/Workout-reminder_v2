---

title: "feat: Progress Tracker"
status: approved
created: 2026-08-13
updated: 2026-08-14
type: feat
depth: medium
owner: team
labels: [frontend, backend, ui]

## Progress Tracker

### Summary

The Progress Tracker introduces a dedicated Progress screen that visualizes a user’s long-term engagement with the app. It includes:

* A GitHub-style daily contribution heatmap
* High-level progress counters
* Current and longest streaks
* FSRS review grade distribution
* Recent exercise history

The feature is built on a dedicated event log (`activity_log`) designed for efficient time-series queries and future analytics.

### Problem Frame

#### Current State

* The app tracks current progress in `user_progress` and spacing telemetry in `active_recall_cards.metadata`.
* Historical engagement data is not stored in a query-friendly format.
* Users cannot see streaks, long-term activity, or review performance trends.

#### User Pain

* No visible sense of long-term accomplishment.
* Hard to measure consistency.
* Reduced motivation to maintain study and break habits.

#### Why Now

As users accumulate sessions and reviews, historical progress becomes a key retention and habit-building mechanism.

### Goals

* Track discrete activity events in a normalized time-series table.
* Visualize daily activity with a contribution heatmap (capturing *all* activity).
* Display meaningful progress metrics.
* Surface FSRS review quality.
* Build a foundation for future analytics.

### Non-goals

* Data export or sync.
* Advanced dashboards or trend comparisons (e.g., "+12% this week" - deferred to avoid demotivating casual users).
* Historical backfill of pre-feature activity.
* Weekly/monthly filters.

### Metric Definitions

To avoid ambiguity, metrics are defined explicitly.

| Metric | Definition |
| --- | --- |
| **Total Sessions** | Count of `session_completed` events. |
| **Total Notes Recalled** | Count of `fsrs_review` events. |
| **Current Streak** | Consecutive local calendar days containing *at least one* activity event. |
| **Longest Streak** | Maximum historical streak using the same rule. |
| **Active Days This Year** | Number of distinct local dates with any activity. |
| **Heatmap Count** | Total aggregate of *all* events (`session_completed`, `fsrs_review`, `exercise_completed`) per local date. |

### Requirements

* **R1.** Record `fsrs_review`, `session_completed`, and `exercise_completed` events.
* **R2.** Store timestamps as Unix epoch milliseconds.
* **R3.** Prevent duplicate event logging using strict `reference_id` checks.
* **R4.** Expose a single Tauri IPC command returning all statistics.
* **R5.** Create a new React Progress page accessible from the main navigation.
* **R6.** Render a GitHub-style heatmap mapping sparse backend data to a grid.
* **R7.** Render counters and streaks.
* **R8.** Render an FSRS grade breakdown.
* **R9.** Render recent exercise history.
* **R10.** Manage schema changes through a `sqlx` migration.
* **R11.** Add backend tests for streak and aggregation logic.

---

### Key Technical Decisions

#### 1. Dedicated Activity Log

Time-series events will be stored in a dedicated SQLite table rather than JSON blobs. This enables efficient range queries, reliable streak calculations, and an extensible event model.

#### 2. Timezone Strategy

All calculations are based on the user’s local calendar date to avoid timezone travel and daylight saving bugs.

* `occurred_at` stores UTC epoch milliseconds.
* `local_date` stores the local date string (e.g. `2026-08-14`).
* Streak calculations operate strictly on `local_date`.

#### 3. Idempotency & Deduplication

A session, review, or exercise completion should only generate one logical event.
The logging API will enforce deduplication by checking for an existing event using **only**:

* `event_type`
* `reference_id` (e.g., the specific exercise or review UUID)

*Note: We will not use a "timestamp window" for deduplication, as fast, successive completions could trigger false positives and drop valid events.*

#### 4. Streak Calculation (Gaps and Islands)

Calculating the "Longest Streak" in SQLite using standard SQL requires complex window functions. To keep the codebase maintainable and performant, the backend will query the distinct `local_date` strings from the database and calculate the longest streak programmatically in Rust memory.

---

### Database Design

```sql
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    occurred_at INTEGER NOT NULL,        -- Unix epoch milliseconds
    local_date TEXT NOT NULL,            -- YYYY-MM-DD in user local timezone
    reference_id TEXT,
    fsrs_grade INTEGER,
    metadata TEXT,
    UNIQUE(event_type, reference_id)     -- Enforces strict idempotency
);

CREATE INDEX idx_activity_time
ON activity_log(occurred_at);

CREATE INDEX idx_activity_local_date
ON activity_log(local_date);

```

### API

A single IPC endpoint minimizes round trips. The backend will return *sparse* data for the heatmap to save bandwidth; React will map this sparse array onto the full calendar grid, injecting `0` for empty days.

```typescript
interface StatisticsPayload {
  counters: {
    totalSessions: number;
    totalNotesRecalled: number;
    currentStreak: number;
    longestStreak: number;
    activeDaysThisYear: number;
  };

  heatmap: Array<{
    date: string;       // YYYY-MM-DD
    count: number;      // Sparse: only dates with > 0 events are returned
  }>;

  fsrsBreakdown: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };

  recentExercises: Array<{
    exerciseId: string;
    completedAt: number;
  }>;
}

```

**Command:** `get_statistics() -> StatisticsPayload`

---

### Frontend Architecture

```text
src/
├── pages/
│   └── Progress.tsx
├── components/
│   ├── Heatmap.tsx           // Handles 0-padding for sparse backend data
│   ├── StatCounters.tsx
│   ├── StreakCard.tsx
│   ├── FSRSBreakdown.tsx
│   └── ExerciseHistory.tsx

```

### UX Behavior

#### Default

The page displays current metrics and a 12-month heatmap. It is placed prominently in the **main navigation sidebar/tab bar** to reinforce habit-building.

#### Empty State

Display a friendly illustration, an explanation of what will appear (heatmaps, streaks), and a clear Call To Action: "Start your first session."

---

### Implementation Units

**U1. Database Migration & Event Logging**

* Create `sqlx` migration with the `UNIQUE(event_type, reference_id)` constraint.
* Implement `log_event()` in Rust.
* Integrate with session/review/exercise completion triggers.

**U2. Statistics Aggregation**

* Calculate daily aggregate heatmap counts (sparse return).
* Fetch distinct active dates and calculate current/longest streaks in Rust memory.
* Aggregate FSRS grades and fetch the last 20 exercises.
* Return `StatisticsPayload` via Tauri IPC.

**U3. Progress UI**

* Create Progress page and add it to the main navigation layout.
* Implement `Heatmap.tsx` to handle mapping sparse backend arrays to a visual 365-day grid.
* Render streak cards, FSRS charts, and recent history.

**U4. Backend Tests**

* **Streaks:** Consecutive days, missing one day, month/year boundaries.
* **Deduplication:** Verify that repeated submissions of the same `reference_id` silently succeed (or ignore) without inflating metrics.
* **FSRS Breakdown:** All grades, missing grades, invalid metadata.

---

### Resolved Decisions

1. **Placement:** The Progress navigation entry will live in the primary navigation (sidebar/bottom tab) rather than being buried in settings.
2. **Heatmap Scope:** The heatmap will reflect *all* activity (reviews, exercises, sessions) rather than just full sessions, to better reward user effort and reinforce daily habits.
3. **Trend Indicators:** Withheld for V1. Percent-based trend comparisons (e.g., "-10% from last week") can demotivate casual learners trying to rebuild a habit. Baseline metrics must be established first.