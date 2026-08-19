---
title: "feat: personalized accountability day & settings priority"
status: proposed
created: 2026-08-19
updated: 2026-08-19
type: feat
depth: medium
owner: Engineering
labels: [core, frontend, backend, ux]
---

# Personalized Accountability Day & Settings Priority

## Summary

This feature improves Daily Accountability for users whose active day extends past midnight and removes an unnecessary UI block when users need to access Settings.

Instead of treating midnight as the beginning of every new accountability day, the application will use a configurable **Day Start Time**.

The default will be **4:00 AM**.

Users can change the Day Start Time in Settings using hourly increments, including `00:00` for traditional calendar-day behavior.

Separately, opening Settings will temporarily suppress the blocking Daily Accountability modal without marking the check-in as completed, dismissed, or skipped.

The core principle is:

> The user's accountability day does not have to match the calendar day.

---

# Problem Frame

## Current state

* Daily Accountability currently uses the local calendar date.
* The logical day changes at midnight.
* Users who remain active after midnight can be prompted for a new day's accountability check while they still consider the previous day ongoing.
* A pending Daily Accountability modal can prevent access to Settings.

## User pain

A user working until 2:00 AM may see a new accountability prompt even though they are still finishing the previous logical day.

A user who wants to change a setting may also be forced to interact with the accountability prompt before accessing Settings.

## Why this solution

A universal 4:00 AM rollover solves the immediate night-owl problem, but it is still an arbitrary assumption.

A configurable Day Start Time solves the underlying problem while keeping the default experience simple.

---

# Goals

* Introduce a configurable **Day Start Time**.
* Default the Day Start Time to **04:00**.
* Allow hourly values from `00:00` through `23:00`.
* Treat times before the configured Day Start Time as belonging to the previous logical day.
* Centralize logical-date calculation in one backend helper.
* Keep actual timestamps separate from logical accountability dates.
* Allow Settings to be accessed while Daily Accountability is pending.
* Restore the accountability blocker after Settings closes if the check-in remains pending.
* Ensure the logical day updates while the application remains open across the configured boundary.

---

# Non-goals

* Automatically detecting the user's sleep schedule.
* Asking the user for their sleep time every day.
* Automatic schedule learning or prediction.
* Integrating with health or sleep tracking services.
* Allowing users to permanently skip Daily Accountability.
* Changing break-reminder timing.
* Rewriting historical accountability responses when the Day Start Time changes.

---

# Product Decisions

## Day Start Time

The setting represents:

> **The time at which a new accountability day begins.**

It does not represent sleep time.

Example:

```text
Day Start Time = 04:00

00:00 ───────────── 03:59 | 04:00 ───────────── 23:59
       previous day       |       current day
```

## Default

```text
04:00
```

This requires no configuration for new or existing users.

## Precision

Hourly increments only.

Allowed values:

```text
00:00
01:00
02:00
...
23:00
```

Minute-level configuration is intentionally excluded from the initial release.

## Midnight

`00:00` is a valid setting.

This allows users to restore traditional calendar-day behavior.

## Setting changes

A Day Start Time change takes effect immediately for future logical-date calculations.

Historical accountability records are not rewritten.

Example:

```text
Current Day Start Time = 04:00
Current time = 02:00

→ belongs to previous logical day

User changes Day Start Time = 01:00

→ current 02:00 time now belongs to the current logical day
```

## Automatic learning

The application will not automatically change the user's Day Start Time.

Future versions may suggest a different time based on usage patterns, but the initial implementation remains explicitly user-controlled.

---

# Requirements

## R1. Persisted Day Start Time

The application must persist the user's Day Start Time.

The canonical value should be represented as minutes since midnight.

Examples:

```text
00:00 → 0
01:00 → 60
04:00 → 240
23:00 → 1380
```

## R2. Default Day Start Time

If no value exists, the application must use:

```text
04:00
```

Existing users must receive the same default unless an existing configuration is available.

## R3. Logical Date Calculation

The backend must calculate the accountability date using local wall-clock time:

```text
if current local time < day_start_time:
    logical_date = previous calendar date
else:
    logical_date = current calendar date
```

At exactly the configured Day Start Time, the new logical day begins.

## R4. Single Source of Truth

The logical-date calculation must exist in one reusable backend helper.

No Daily Accountability command should independently implement date-offset logic.

Conceptually:

```rust
logical_date(now, day_start_time)
```

## R5. Daily Accountability Reads

`check_daily_question_status` must use the shared logical-date helper.

## R6. Daily Accountability Writes

`submit_daily_question_response` must use the same helper to associate a response with the appropriate logical date.

## R7. Actual Timestamp Preservation

The actual response timestamp must remain the real submission time.

Logical date and actual timestamp must not be conflated.

Example:

```text
actual timestamp = 2026-08-19 02:15
logical date     = 2026-08-18
```

## R8. Settings Accessibility

Opening Settings while Daily Accountability is pending must temporarily remove the accountability blocker.

Settings must remain fully interactive.

## R9. No Accidental Completion

Opening or closing Settings must not:

* mark the check-in as answered
* mark it as skipped
* permanently dismiss it
* modify the response
* modify historical accountability data

## R10. Modal Restoration

If the check-in remains pending when Settings closes, the accountability modal must become blocking again.

## R11. Runtime Boundary Detection

If the application remains open across the configured Day Start Time, Daily Accountability must eventually reevaluate its status for the new logical day.

Existing polling, refresh, resume, or event infrastructure should be reused where possible.

---

# Data Model

Add a persisted setting:

```text
day_start_time
```

Canonical representation:

```text
integer: minutes since midnight
```

Default:

```text
240
```

No historical Daily Accountability records should be modified by this feature.

If accountability responses currently store only a date, that date should represent the logical accountability date.

If responses store both date and timestamp, the logical date and actual timestamp must remain independent.

---

# Backend Architecture

## Logical Date Helper

Create a shared helper:

```rust
fn logical_date(
    now: DateTime<Local>,
    day_start_time: NaiveTime,
) -> NaiveDate
```

Conceptual implementation:

```rust
fn logical_date(
    now: DateTime<Local>,
    day_start_time: NaiveTime,
) -> NaiveDate {
    if now.time() < day_start_time {
        now.date_naive()
            .pred_opt()
            .expect("previous date should exist")
    } else {
        now.date_naive()
    }
}
```

The helper must accept the current time as an argument rather than calling `Local::now()` internally.

This makes the boundary deterministic and straightforward to unit test.

---

# Frontend Architecture

Business state and UI state must remain separate.

## Business state

```text
dailyCheckinPending
logicalDate
```

## UI state

```text
showSettings
```

Modal visibility should be derived:

```text
showAccountabilityModal =
    dailyCheckinPending && !showSettings
```

Opening Settings must not modify `dailyCheckinPending`.

This means:

```text
pending = true
settings = true
modal = hidden
```

and after closing Settings:

```text
pending = true
settings = false
modal = visible
```

---

# UX

## Settings UI

Add:

```text
Daily Accountability

Day Start Time
[ 04:00 AM ]

Your accountability day starts at this time.
```

Use hourly selection.

Example options:

```text
12:00 AM
1:00 AM
2:00 AM
3:00 AM
4:00 AM
...
11:00 PM
```

The default remains `4:00 AM`.

Do not expose technical terms such as "logical date", "offset", or "rollover calculation" in the user-facing UI.

---

# Implementation Units

## U1. Logical Date Helper

**Goal:** Establish the single source of truth for the accountability day.

**Files:**

```text
src-tauri/src/...
```

**Work:**

1. Create `logical_date()`.
2. Accept an injected local datetime.
3. Accept Day Start Time.
4. Return `NaiveDate`.
5. Replace duplicated date calculations.

**Tests:**

* midnight
* just before boundary
* exactly at boundary
* just after boundary
* month boundary
* year boundary

---

## U2. Day Start Time Persistence

**Goal:** Store and expose the user's Day Start Time.

**Work:**

1. Add persisted setting.
2. Default to `04:00`.
3. Validate values.
4. Add backend read/write support.
5. Expose the setting to the frontend.

Valid range:

```text
00:00–23:00
```

with one-hour increments.

---

## U3. Daily Accountability Integration

**Goal:** Make all Daily Accountability operations use the shared logical date.

**Work:**

1. Load Day Start Time.
2. Calculate logical date.
3. Use it for status lookup.
4. Use it when saving responses.
5. Preserve actual submission timestamps.

---

## U4. Settings Modal Priority

**Goal:** Allow Settings to temporarily override the accountability blocker.

**Files:**

```text
src/App.jsx
```

**Work:**

1. Preserve pending accountability state.
2. Preserve Settings state.
3. Derive modal visibility from both.
4. Hide the blocker while Settings is open.
5. Restore it when Settings closes.

Verify that unmounting the modal does not destroy important transient response state.

---

## U5. Runtime Boundary Refresh

**Goal:** Correctly handle a logical day change while the app remains open.

**Work:**

1. Inspect existing Daily Accountability refresh mechanisms.
2. Reuse existing polling/events where possible.
3. Reevaluate on application resume/wake.
4. Ensure the configured boundary eventually triggers reevaluation.
5. Avoid creating duplicate timers if existing infrastructure already handles this.

---

## U6. Settings UI

**Goal:** Give users control without adding unnecessary complexity.

**Work:**

1. Add Day Start Time control.
2. Default to 4 AM.
3. Provide hourly choices.
4. Allow 12 AM.
5. Persist changes.
6. Apply changes immediately.

---

## U7. Documentation

Update:

```text
docs/behind-the-scenes/daily-accountability.md
```

Document:

* Day Start Time
* 4 AM default
* logical-date calculation
* configurable boundary
* actual timestamp vs logical date
* Settings override behavior

---

# Testing Strategy

## Unit Tests

### Default 4 AM boundary

```text
03:59 → previous day
04:00 → current day
04:01 → current day
```

### Midnight

```text
00:00 → previous day
01:00 → previous day
```

### Custom 2 AM boundary

```text
01:59 → previous day
02:00 → current day
```

### Custom 6 AM boundary

```text
05:59 → previous day
06:00 → current day
```

### Midnight configuration

```text
Day Start = 00:00

00:00 → current day
23:59 → current day
```

### Calendar boundaries

```text
Jan 1 02:00 → Dec 31 previous year
Mar 1 02:00 → Feb 28/29
```

---

# Integration Tests

Verify:

```text
logical_date()
    ↓
check_daily_question_status()
    ↓
submit_daily_question_response()
    ↓
check_daily_question_status()
```

A response submitted before the Day Start Time must belong to the previous logical day.

Changing Day Start Time must not rewrite historical responses.

---

# Frontend Tests

### Pending check-in

```text
pending = true
settings = false
→ blocker visible
```

### Settings override

```text
pending = true
settings = true
→ blocker hidden
→ Settings interactive
```

### Restore

```text
pending = true
Settings opens
Settings closes
→ blocker visible again
```

### No pending check-in

```text
pending = false
Settings opens/closes
→ blocker remains absent
```

---

# Runtime Tests

Verify:

* App open at 03:59 and remaining open past 04:00.
* App asleep during the boundary and waking afterward.
* App reopened after the boundary.
* Settings opened while a check-in is pending.
* Settings closed while the check-in is still pending.
* Day Start Time changed while a check-in is pending.

---

# Risks & Mitigations

| Risk                                            | Mitigation                                   |
| ----------------------------------------------- | -------------------------------------------- |
| Frontend/backend disagree about the logical day | Backend owns the canonical calculation       |
| Duplicate date logic                            | One shared `logical_date()` helper           |
| Arbitrary 4 AM assumption                       | 4 AM is only the default; user can customize |
| User accidentally skips accountability          | Settings only changes UI visibility          |
| Modal state is lost                             | Keep pending state outside the modal         |
| App misses the day boundary                     | Reevaluate on boundary/resume/polling        |
| Actual timestamps become inaccurate             | Store logical date separately                |
| User selects an invalid time                    | Validate and constrain UI/backend values     |
| Configuration becomes confusing                 | Call it "Day Start Time"                     |
| Historical data changes unexpectedly            | Never rewrite historical records             |
| Overengineering runtime scheduling              | Reuse existing refresh/event infrastructure  |

---

# Migration

Existing users with no stored Day Start Time receive:

```text
04:00
```

This gives them the intended night-owl behavior immediately without requiring setup.

Existing accountability records remain unchanged.

No historical data migration is required beyond adding the new setting with its default value.

---

# Rollout Plan

## Phase 1 — Backend

* Add Day Start Time persistence.
* Add `logical_date()`.
* Add unit tests.
* Integrate with Daily Accountability read/write operations.

## Phase 2 — Frontend

* Add Day Start Time setting.
* Implement Settings priority.
* Verify pending-state restoration.

## Phase 3 — Runtime

* Verify behavior across the Day Start Time boundary.
* Test application sleep/wake and resume.
* Verify existing refresh infrastructure is sufficient.

## Phase 4 — QA

Test:

```text
04:00 default
02:00 custom
00:00 custom
03:59 → 04:00
Settings override
response persistence
historical data preservation
app open across boundary
```

---

# Rollback

The feature can be rolled back independently:

### Settings

Remove the Settings override behavior.

### Day Start Time

Fall back to:

```text
04:00
```

while retaining the centralized `logical_date()` architecture.

Historical accountability records must not be modified during rollback.

---

# Final Product Principle

Daily Accountability should reflect the user's **logical day**, not blindly follow midnight.

The product should be:

* **Simple by default:** 4 AM
* **Flexible when needed:** user-selected Day Start Time
* **Consistent:** one backend logical-date calculation
* **Safe:** Settings never marks accountability as complete
* **Accurate:** actual timestamps remain actual timestamps
* **Testable:** the day boundary is explicit and deterministic

The initial release should solve the night-owl problem without forcing every user to configure anything.
