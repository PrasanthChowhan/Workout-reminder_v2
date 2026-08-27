# Topic Starring and Anki-Style Card Browser — Final Upgraded Plan

## Summary

This feature allows users to star specific learning topics so they become a **priority pool** for active recall.

When starred topics contain due cards, the scheduler prioritizes those cards. If there are no due cards in starred topics, the scheduler falls back to the normal/global recall behavior.

The feature also introduces an Anki-style Card Browser in the Cards Settings UI for viewing, sorting, searching, and filtering all active recall variants.

The FSRS/spaced-repetition algorithm itself is not modified.

---

## Problem Frame

### Current State

* Active recall cards are selected from all imported topics/concepts.
* Users cannot prioritize specific topics for immediate study.
* Users can view concepts in the Cards Tab, but there is no unified browser for all variants.
* Users cannot easily identify cards due next or compare stability/difficulty across the entire collection.

### User Pain

* Important topics can be diluted by large imported decks.
* Users have no lightweight way to tell the scheduler "prioritize these topics."
* Finding specific cards across many topics requires navigating topic-by-topic.

### Why Now

As imported decks grow, users need a way to focus attention without deleting, suspending, or permanently excluding other topics.

---

# Goals

* Allow users to mark specific topics as **starred/priority topics**.
* Modify active recall so starred topics are prioritized when they have due cards.
* Preserve normal/global recall behavior when the starred priority pool has no due cards.
* Provide a unified Card Browser for all variants.
* Support sorting by Due Date, State, and Difficulty.
* Add search and basic filtering to make the Browser useful for larger decks.
* Persist starred state across application restarts and topic updates.

---

# Non-Goals

* Full custom filtered decks like Anki.
* Different scheduling rules for starred topics.
* Individual variant/card starring.
* Individual card suspension.
* Changes to the FSRS algorithm.
* Complex multi-tag boolean filtering.
* Advanced bulk card operations.

---

# Requirements

### R1 — Topic Starring

Users can toggle a star status on any topic from the Cards Settings tab.

### R2 — Priority Pool

If one or more topics are starred **and those topics contain due cards**, the scheduler should prioritize due cards belonging to starred topics.

### R3 — Normal Fallback

If starred topics contain **no due cards**, the scheduler falls back to the existing global recall behavior.

Unstarred topics remain eligible during this fallback.

### R4 — No Stars

If no topics are starred, the scheduler behaves exactly as it does today.

### R5 — Card Browser

A new Card Browser view exists inside the Cards Settings UI and displays a flat list of all variants.

### R6 — Browser Sorting

The Card Browser supports sorting by at least:

* Due Date
* State
* Difficulty

### R7 — Browser Search/Filtering

The Card Browser supports:

* Text search.
* Topic filtering.
* State filtering.
* Clearing/resetting filters.

### R8 — Migration

A V9 database migration adds `is_starred` safely to existing installations.

### R9 — Persistence

Starred state survives application restart and re-import/update of an existing topic.

### R10 — Failure Handling

Failed star/unstar operations must not leave the UI displaying an incorrect persisted state.

---

# Success Criteria

* Users can prioritize one or more topics without removing other topics from their deck.
* Due cards from starred topics are selected before normal/global cards.
* When no starred card is due, normal/global recall continues.
* Starred state persists across application restarts.
* Re-importing an existing topic does not reset its star state.
* Existing V8 databases migrate successfully to V9.
* Users can inspect all variants from a single Card Browser.
* Users can sort, search, and filter cards.
* No material performance regression occurs in `get_due_recall_card`.

---

# Key Technical Decisions

## Priority Pool, Not Hard Filter

Starring is a **priority mechanism**, not a restriction.

```text
Get eligible due cards
        ↓
Are there due cards
in starred topics?
      /       \
    YES        NO
     ↓          ↓
Starred pool   Existing
     ↓         global pool
     └────┬─────┘
          ↓
 Existing scheduler
          ↓
      Select card
```

This means:

* Starred + due → prioritize starred.
* Starred + nothing due → use normal scheduler.
* No stars → use normal scheduler.

The scheduler should not modify FSRS behavior; it only changes the candidate pool considered before normal selection.

---

# High-Level Design

## Data Flow

```text
Active Recall Trigger
        ↓
Fetch eligible due cards
        ↓
Check starred topics
        ↓
Do starred topics have due cards?
      /        \
    YES         NO
     ↓           ↓
Starred due     All due
candidate pool  candidates
      \          /
       \        /
        ↓      ↓
      Select card
          ↓
     Display user
```

---

# Database Schema

## Modified `recall_concepts`

```sql
CREATE TABLE recall_concepts (
    concept_id TEXT PRIMARY KEY,
    concept_title TEXT NOT NULL,
    tags TEXT NOT NULL,
    source_title TEXT,
    source_url TEXT,
    is_starred INTEGER NOT NULL DEFAULT 0
);
```

---

# V9 Database Migration

## Goal

Safely add starring to existing installations.

### Migration

Use the application's normal schema migration mechanism:

```sql
ALTER TABLE recall_concepts
ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0;
```

### Migration Rules

* V8 → V9 must migrate successfully.
* Existing topics receive `is_starred = 0`.
* Existing variants remain unchanged.
* Existing FSRS/scheduling state remains unchanged.
* Migration must not duplicate or corrupt schema state.
* Migration must be tested against a representative V8 database fixture.

### Indexing

Review the actual scheduler query plan after implementation.

Add an index involving `is_starred` only where it provides a measurable benefit.

---

# Import / Update Behavior

When an existing topic is updated or re-imported:

```text
Existing Topic
    ↓
Already starred?
    ↓
YES → Preserve is_starred = 1
NO  → Preserve is_starred = 0
```

New topics default to:

```text
is_starred = 0
```

Re-importing a deck must never unexpectedly remove a user's starring preference.

---

# Delete Behavior

When a topic is deleted:

* Its starred state is deleted with the topic.
* Its variants follow the existing deletion behavior.
* Re-importing a deleted topic creates it according to normal import behavior and defaults to unstarred.

---

# Component / Module Architecture

```text
src/components/settings/

├── CardsTab.jsx
└── cards/
    ├── AiRecallModal.jsx
    ├── CardBrowser.jsx
    └── CardBrowser.module.css
```

---

# State Ownership

* `is_starred` is persisted in SQLite.
* Star/unstar state is owned by the backend/database.
* Optimistic UI state is temporary React state.
* Browser search/filter/sort state remains ephemeral UI state.
* Browser state does not need to persist across application restarts in V1.

---

# Scheduler Architecture

## Goal

Keep priority selection separate from FSRS.

### Proposed Logic

```text
get_due_recall_card()
        ↓
Find due cards
        ↓
Find starred topics with due cards
        ↓
If starred due cards exist
        → use starred due cards
Else
        → use existing global candidates
        ↓
Existing selection logic
        ↓
Return card
```

### Important Rule

The fallback to global cards occurs **only when there are no due cards in the starred priority pool**.

This means a starred topic with no due card does not block normal study.

---

# Backend Queries

## Starred Due Candidate Query

The scheduler should be able to identify due variants whose parent concept is starred.

Conceptually:

```sql
SELECT ...
FROM recall_variants v
JOIN recall_concepts c
  ON v.concept_id = c.concept_id
WHERE c.is_starred = 1
  AND <existing due-card conditions>;
```

The existing scheduler conditions should remain unchanged.

## Fallback

If the starred query produces zero due cards:

```text
Use existing get_due_recall_card behavior.
```

Do not duplicate or rewrite the entire scheduling algorithm.

---

# IPC

## `toggle_concept_star`

Add an IPC command that:

1. Receives a concept ID.
2. Toggles `is_starred`.
3. Persists the result.
4. Returns the resulting state.
5. Returns an error if the concept does not exist or the database operation fails.

Register the command in `main.rs`.

---

# Cards Tab Starring UI

## Goal

Allow users to prioritize topics directly from Topic View.

### Behavior

* Display a star button next to every topic.
* Clicking toggles starred state.
* Use optimistic UI.
* Roll back if IPC fails.
* Refresh/reconcile state after successful persistence.

### Accessibility

The star must:

* Be a real `<button>`.
* Be keyboard focusable.
* Have a visible focus state.
* Use `aria-pressed`.
* Use:

  * `Star Topic`
  * `Unstar Topic`

---

# Priority Indicator

The Cards Tab should make the behavior discoverable.

When stars are active:

```text
★ 2 priority topics
```

Optional supporting text:

```text
Due cards from these topics are prioritized first.
```

When no topics are starred:

```text
All topics are included normally.
```

This should not rely exclusively on a tooltip.

---

# Card Browser

## Goal

Provide an Anki-style flat browser for all recall variants.

### Views

```text
Cards
├── Topic View
└── Browser View
```

Topic View remains the default.

---

# Card Browser Columns

Minimum:

* Topic
* Card / Prompt
* State
* Due Date
* Difficulty
* Stability

---

# Browser Features

### Sorting

Support:

* Due Date.
* State.
* Difficulty.
* Ascending/descending direction.

### Search

Search across relevant card/topic text.

### Filters

Support:

* Topic.
* State.

### Controls

* Clear filters.
* Reset sorting.
* Show total card count.
* Show filtered result count.

---

# Browser Data API

Recommended IPC shape:

```text
get_recall_variants(
    search,
    topic_id,
    state,
    sort_by,
    sort_direction,
    limit,
    offset
)
```

V1 may perform sorting/filtering client-side if current dataset sizes make this practical.

The API should still be structured so server-side filtering/pagination can be introduced later without redesigning the UI.

---

# Browser States

## Loading

Show a lightweight loading indicator.

## Empty Database

```text
No cards available.
```

## No Search Results

```text
No cards match your filters.
```

## Error

If loading fails:

* Show an error message.
* Provide retry.
* Preserve the rest of Cards Tab.
* Do not silently present stale/empty data as a successful query.

---

# Card Interaction

V1 is primarily read-oriented.

Users can:

* Inspect cards.
* Search.
* Filter.
* Sort.
* Navigate back to Topic View.

Individual card suspension/starring remains deferred.

If existing card editing/opening behavior exists, reuse it rather than creating a duplicate implementation.

---

# Star State During Active Recall

The priority pool is evaluated when a **new recall card is requested**.

Example:

```text
Topic A = starred
Topic B = unstarred

Recall #1
→ A has a due card
→ Select A

User unstars A

Recall #2
→ No starred topics
→ Existing global behavior
```

A card already displayed is not retroactively changed if the user changes starring.

---

# Performance

### Target

Support approximately:

* 1,000–5,000 cards comfortably.
* 10,000+ cards as a scalability boundary.

### Scheduler

Ensure the priority query does not materially regress `get_due_recall_card`.

### Browser

If large datasets cause rendering problems:

1. Profile first.
2. Optimize query/filtering.
3. Introduce virtualization only if needed.

---

# Testing Strategy

## Database Tests

* V8 → V9 migration succeeds.
* Existing data remains intact.
* Existing concepts default to unstarred.
* FSRS/scheduling data remains unchanged.
* Migration is safe on repeated startup.

## Import Tests

* New topic → unstarred.
* Existing unstarred topic → remains unstarred.
* Existing starred topic → remains starred after re-import/update.
* Deleted topic → star state removed.

## Scheduler Tests

### Case 1 — No Stars

Expected:

```text
Existing global behavior
```

### Case 2 — Starred Topic Has Due Card

Expected:

```text
Select from starred due cards
```

### Case 3 — Multiple Starred Topics

Expected:

```text
Select from due cards belonging to starred topics
```

### Case 4 — Starred Topics Have No Due Cards

Expected:

```text
Fall back to normal/global scheduler
```

### Case 5 — Starred Topic Has No Cards

Expected:

```text
Normal/global scheduler
```

### Case 6 — Remove Final Star

Expected:

```text
Normal/global scheduler
```

---

# IPC Tests

* Valid star toggle succeeds.
* State is persisted.
* Resulting state is returned correctly.
* Missing concept returns an error.
* Database failure returns an error.

---

# UI Tests

* Star state renders correctly.
* Clicking star updates immediately.
* Failed IPC rolls state back.
* State persists after refresh/reload.
* Keyboard activation works.
* `aria-pressed` is correct.
* Browser sorting works.
* Search works.
* Filters work.
* Counts update.
* Loading state works.
* Empty states work.
* Error/retry state works.

---

# Manual QA

## Scenario A — Priority Topic

1. Import a large JSON deck.
2. Star one topic.
3. Ensure that topic has a due card.
4. Trigger `Ctrl + Alt + R`.
5. Confirm the starred due card is prioritized.
6. Repeat with multiple cards.

## Scenario B — Priority Pool Exhausted

1. Star Topic A.
2. Ensure Topic A has no due cards.
3. Ensure another topic has due cards.
4. Trigger active recall.
5. Confirm the scheduler falls back to normal/global behavior.

## Scenario C — Multiple Priority Topics

1. Star Topics A and B.
2. Ensure both contain due cards.
3. Trigger multiple recalls.
4. Confirm selections come from the starred due pool.

## Scenario D — Persistence

1. Star a topic.
2. Restart the application.
3. Confirm it remains starred.

## Scenario E — Re-import

1. Star a topic.
2. Re-import/update its deck.
3. Confirm the topic remains starred.

## Scenario F — Browser

1. Open Browser View.
2. Verify all variants.
3. Test Due Date sorting.
4. Test State sorting.
5. Test Difficulty sorting.
6. Test ascending/descending.
7. Test search.
8. Test topic filtering.
9. Test state filtering.
10. Clear filters.
11. Verify counts.

---

# Implementation Units

## U1 — Database Schema & Migration

**Goal:** Safely add persistent starring.

**Files:**

* `src-tauri/src/db/queries.rs`
* `src-tauri/src/utils/db.rs`
* `src-tauri/src/main.rs`

**Work:**

1. Implement V9 migration.
2. Add `is_starred`.
3. Default existing/new topics to `0`.
4. Preserve star state during import/update.
5. Define deletion behavior.
6. Review query indexes.
7. Add V8 → V9 migration tests.

---

## U2 — Scheduler Priority Pool

**Goal:** Prioritize starred topics without restricting fallback behavior.

**Work:**

1. Identify starred topics with due cards.
2. If due starred cards exist, use that candidate pool.
3. If none exist, use existing global scheduler behavior.
4. Preserve existing FSRS logic.
5. Add automated scheduler tests.

---

## U3 — Topic Star IPC

**Goal:** Persist topic priority state.

**Work:**

1. Add `toggle_concept_star`.
2. Return resulting state.
3. Handle errors.
4. Register command.
5. Add tests.

---

## U4 — Cards Tab Starring UI

**Goal:** Add accessible topic starring.

**Files:**

* `src/components/settings/CardsTab.jsx`
* `src/components/settings/CardsTab.module.css`

**Work:**

1. Surface `is_starred`.
2. Add star button.
3. Add optimistic update.
4. Add rollback on failure.
5. Add priority indicator.
6. Preserve Topic View.

---

## U5 — Card Browser Data Layer

**Goal:** Provide flat variant access.

**Work:**

1. Add `get_recall_variants`.
2. Return topic/card metadata.
3. Support search.
4. Support filtering.
5. Support sorting.
6. Support limit/offset.
7. Register IPC.
8. Add query tests.

---

## U6 — Card Browser UI

**Goal:** Build the Anki-style browser.

**Files:**

* `src/components/settings/cards/CardBrowser.jsx`
* `src/components/settings/cards/CardBrowser.module.css`
* `src/components/settings/CardsTab.jsx`

**Work:**

1. Add Browser View toggle.
2. Build table.
3. Add required columns.
4. Add sorting.
5. Add search.
6. Add filters.
7. Add counts.
8. Add loading state.
9. Add empty states.
10. Add error/retry state.
11. Add accessibility behavior.

---

# Rollout Plan

## Phase 1 — Database & Scheduler

* Implement V9 migration.
* Validate V8 → V9 upgrade.
* Implement persistent starring.
* Implement priority-pool scheduler behavior.
* Add automated backend tests.

## Phase 2 — Starring UI

* Add topic star controls.
* Add optimistic updates.
* Add rollback/error handling.
* Validate persistence.
* Validate priority behavior.

## Phase 3 — Card Browser

* Implement variant query.
* Implement Browser View.
* Add sorting.
* Add search.
* Add filtering.
* Add loading/error/empty states.
* Validate performance.

## Phase 4 — End-to-End QA

* Test priority cards.
* Test fallback to global cards.
* Test multiple starred topics.
* Test restart persistence.
* Test re-import.
* Test database migration.
* Test accessibility.
* Test large datasets.

## Phase 5 — Release

* Verify production migration path.
* Verify V8 → V9 upgrade.
* Merge and release.
* Monitor scheduler and Browser performance.

---

# Final Scope

## In Scope

* Topic-level starring.
* Starred topics as a **priority pool**.
* Normal/global fallback when no starred cards are due.
* V9 database migration.
* Star persistence.
* Import/update preservation.
* Accessible starring UI.
* Card Browser.
* Sorting.
* Search.
* Filtering.
* Loading/error/empty states.
* Automated migration and scheduler tests.

## Deferred

* Individual card starring.
* Individual card suspension.
* Custom filtered decks.
* Custom scheduling rules.
* Complex multi-tag filtering.
* Bulk card operations.
* Virtualized rendering unless profiling requires it.

## Out of Scope

* Changes to FSRS.
* Changes to normal scheduler behavior when no priority cards are available.
* Full Anki-compatible filtered-deck functionality.
