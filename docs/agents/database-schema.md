# SQLite Database Schema Specification

This document specifies the SQLite database schema used by the Workout & Break Reminder app for persistence. The database is initialized and managed by the Rust backend using `sqlx` (as detailed in [ADR 0003](file:///E:/00_HeadQuaters/50_Projects/Workout%20reminder_v2/docs/adr/0003-migrate-persistence-to-sqlite.md)).

Database File Location: `{AppDataDir}/workout_data.sqlite`

---

## 1. Relational Schema & Tables

### 1.1 `settings` Table
Stores high-frequency timer intervals and application startup preferences.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY CHECK(id = 1) | Enforces a single row. |
| `micro_break_interval_mins` | INTEGER | NOT NULL | Interval between eye breaks. |
| `active_break_interval_mins` | INTEGER | NOT NULL | Interval between physical breaks. |
| `micro_break_duration_secs` | INTEGER | NOT NULL | Duration of eye breaks. |
| `active_break_duration_secs` | INTEGER | NOT NULL | Duration of physical breaks. |
| `run_at_start` | INTEGER | NOT NULL | 1 (true) if app launches at OS start, 0 (false) otherwise. |

---

### 1.2 `active_recall_cards` Table
Stores flashcard contents and review history metadata.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique card identifier (slug). |
| `question` | TEXT | NOT NULL | The query displayed to the user. |
| `answer` | TEXT | NOT NULL | The solution toggleable in UI. |
| `category` | TEXT | NOT NULL | Learning topic (e.g. "Rust", "System Design"). |
| `source` | TEXT | NULL | URL citation or reference. |
| `metadata` | TEXT | NULL | JSON string encoding spacing / review history telemetry. |

---

### 1.3 `reflection_prompts` Table
Stores alignment prompts for the Refocus break.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier. |
| `prompt` | TEXT | NOT NULL UNIQUE | The rubber-ducking question. |

---

### 1.4 `stretches` Table
Stores standalone physical stretch movements.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | TEXT | PRIMARY KEY | Unique stretch name. |
| `description` | TEXT | NOT NULL | instructions and guidelines. |
| `duration_secs` | INTEGER | NOT NULL | Hold or completion duration. |
| `difficulty_level` | TEXT | NOT NULL | Difficulty tier (e.g. "Beginner"). |
| `sets` | INTEGER | NOT NULL | Number of working sets. |
| `reps` | TEXT | NULL | Instruction notes (e.g., "Hold 30s"). |
| `video_url` | TEXT | NULL | Tutorial URL. |
| `image_url` | TEXT | NULL | Relative asset pathway or absolute URL. |
| `is_unilateral` | INTEGER | NOT NULL | 1 if unilateral (done per side), 0 if bilateral. |
| `equipment` | TEXT | NOT NULL | JSON string array of required equipment (e.g., `["Mat"]`). |
| `rest_secs` | INTEGER | NOT NULL | Rest duration after execution. |
| `metadata` | TEXT | NULL | JSON string encoding extra dynamic parameters. |

---

### 1.5 `physical_tracks` Table
Stores progressive programs (e.g., "Split Training Program").

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique track identifier. |
| `name` | TEXT | NOT NULL | Display name. |
| `description` | TEXT | NOT NULL | Program intent statement. |
| `metadata` | TEXT | NULL | JSON string containing settings (e.g. excluded exercises list). |

---

### 1.6 `levels` Table
Stores generated/compiled levels mapping to a track based on difficulty filters.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `track_id` | TEXT | NOT NULL | Foreign key referencing `physical_tracks(id)`. |
| `level_number` | INTEGER | NOT NULL | Progression level index. |
| `title` | TEXT | NOT NULL | Exercise title. |
| `description` | TEXT | NOT NULL | Aggregated metadata & descriptions. |
| `target_duration_secs` | INTEGER | NOT NULL | Target hold duration. |
| `video_url` | TEXT | NULL | Tutorial URL. |
| `image_url` | TEXT | NULL | Thumbnail image path. |
| `is_unilateral` | INTEGER | NOT NULL | 1 (unilateral), 0 (bilateral). |
| `equipment` | TEXT | NOT NULL | JSON string array of required equipment. |
| `rest_secs` | INTEGER | NOT NULL | Rest period. |
| `reps` | TEXT | NULL | Reps display string. |
| `sets` | INTEGER | NULL | Number of sets. |

**Keys**:
- `PRIMARY KEY (track_id, level_number)`
- `FOREIGN KEY (track_id) REFERENCES physical_tracks(id) ON DELETE CASCADE`
- Index `idx_levels_track_id` is created on `track_id` for fast level loads.

---

### 1.7 `custom_exercises` Table
Stores the raw exercises (combining details and prescriptions) associated with a track.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `track_id` | TEXT | NOT NULL | Foreign key referencing `physical_tracks(id)`. |
| `id` | TEXT | NULL | Exercise identifier slug (e.g. `ex_glute_bridge`). |
| `name` | TEXT | NOT NULL | Exercise name. |
| `description` | TEXT | NOT NULL | Description. |
| `execution_notes` | TEXT | NULL | Cues and execution steps. |
| `category` | TEXT | NOT NULL | Exercise category enum (e.g. "Neural Dynamics"). |
| `target_muscles` | TEXT | NOT NULL | JSON string array of target muscles. |
| `muscle_groups` | TEXT | NOT NULL | JSON string array of muscle groups. |
| `difficulty` | TEXT | NOT NULL | Difficulty tier (Beginner, Intermediate, etc.). |
| `duration_secs` | INTEGER | NOT NULL | hold duration or 0 if strictly rep-based. |
| `sets` | INTEGER | NOT NULL | Number of sets. |
| `reps` | TEXT | NULL | Custom reps string (legacy). |
| `reps_min` | INTEGER | NULL | Minimum reps range constraint. |
| `reps_max` | INTEGER | NULL | Maximum reps range constraint. |
| `video_url` | TEXT | NULL | Tutorial link. |
| `image_url` | TEXT | NULL | Thumbnail link. |
| `is_unilateral` | INTEGER | NOT NULL | 1 (unilateral), 0 (bilateral). |
| `equipment` | TEXT | NOT NULL | JSON string array of required equipment. |
| `rest_secs` | INTEGER | NOT NULL | Rest period. |

**Keys**:
- `PRIMARY KEY (track_id, name)`
- `FOREIGN KEY (track_id) REFERENCES physical_tracks(id) ON DELETE CASCADE`
- Index `idx_exercises_track_id` is created on `track_id`.

---

### 1.8 `user_progress` Table
Stores current user tracking metrics and active track position.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY CHECK(id = 1) | Enforces a single user row. |
| `active_track_id` | TEXT | NULL | ID of the active track or NULL. |
| `current_level_number` | INTEGER | NULL | Current level index or NULL. |
| `onboarding_tier` | TEXT | NULL | User onboarding difficulty tier. |
| `completed_sessions_count` | INTEGER | NOT NULL | Completed active breaks at current level. |
| `last_completed_at` | TEXT | NULL | RFC3339 timestamp. |
| `level_started_at` | TEXT | NULL | RFC3339 timestamp. |
