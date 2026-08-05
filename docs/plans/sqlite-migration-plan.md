***
title: "feat: Migrate to SQLite Database (Async/sqlx)"
status: proposed
created: 2026-08-05
updated: 2026-08-05
type: feat
depth: deep
labels: [backend, persistence, database, async]
***

# Migrate Persistence to SQLite Database

## Summary

Migrate the application's persistent storage from a single `config.json` file to a robust SQLite database. Based on critical architectural review, this plan utilizes `sqlx` for async-native compatibility with Tokio (Tauri's runtime) and drops the full in-memory state cache to establish the database as the Single Source of Truth.

***

## User Review Required

> [!IMPORTANT]  
> **Backend Async Framework:** We will use `sqlx` instead of `rusqlite`. `rusqlite` is synchronous and would block Tauri's Tokio async runtime (causing timer stutters) unless wrapped in `spawn_blocking`. `sqlx` provides a native async/await connection pool that plays perfectly with Tauri.

> [!WARNING]  
> **Two Sources of Truth:** We will drop the `Mutex<AppConfig>` global cache for large datasets (tracks, levels, flashcards). `state.rs` will only cache high-frequency, read-only settings (like break intervals) to power the 1-second timer tick. All other operations will read/write directly to SQLite, relying on SQLite's microsecond lookup speeds.

***

## Proposed Changes

### Cargo.toml (Rust Dependencies)
Add `sqlx` and the `tokio` runtime features required for async database operations.

#### [MODIFY] src-tauri/Cargo.toml
```toml
[dependencies]
# ... existing dependencies
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio-rustls", "json"] }
```

***

### Database Initialization & Migrations

#### [NEW] src-tauri/src/utils/db.rs
Initialize the `sqlx::SqlitePool`, explicitly enable foreign keys, and run versioned migrations using `PRAGMA user_version` to safely handle future schema changes (avoiding the pitfalls of `IF NOT EXISTS`).

```rust
use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, SqlitePool, Row};
use std::path::PathBuf;
use std::str::FromStr;

pub async fn init_db(app_data_dir: &PathBuf) -> Result<SqlitePool, String> {
    let db_path = app_data_dir.join("workout_data.sqlite");
    
    // Explicitly Enable Foreign Keys at the connection level
    let connect_options = SqliteConnectOptions::from_str(&format!("sqlite://{}", db_path.display()))
        .map_err(|e| e.to_string())?
        .create_if_missing(true)
        .pragma("foreign_keys", "ON");

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await
        .map_err(|e| e.to_string())?;
    
    run_migrations(&pool).await?;

    Ok(pool)
}

async fn run_migrations(pool: &SqlitePool) -> Result<(), String> {
    // Transactional schema migration using PRAGMA user_version
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    
    let version: i32 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(&mut *tx)
        .await
        .unwrap_or(0);

    if version < 1 {
        sqlx::query(
            "CREATE TABLE settings ( ... );
             CREATE TABLE active_recall_cards ( ... );
             CREATE TABLE reflection_prompts ( ... );
             CREATE TABLE stretches ( ... );
             CREATE TABLE physical_tracks (
                 id TEXT PRIMARY KEY,
                 name TEXT,
                 description TEXT,
                 metadata TEXT
             );
             CREATE TABLE levels (
                 track_id TEXT,
                 level_number INTEGER,
                 title TEXT,
                 -- ...
                 PRIMARY KEY (track_id, level_number),
                 FOREIGN KEY(track_id) REFERENCES physical_tracks(id) ON DELETE CASCADE
             );
             -- Prevent full table scans during lookup
             CREATE INDEX idx_levels_track_id ON levels(track_id);
             
             CREATE TABLE custom_exercises (
                 track_id TEXT,
                 name TEXT,
                 -- ...
                 PRIMARY KEY (track_id, name),
                 FOREIGN KEY(track_id) REFERENCES physical_tracks(id) ON DELETE CASCADE
             );
             CREATE INDEX idx_exercises_track_id ON custom_exercises(track_id);
             
             CREATE TABLE user_progress ( ... );
             
             PRAGMA user_version = 1;"
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }
    
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
```

***

### File System / Data Migration (Atomic)

#### [MODIFY] src-tauri/src/utils/fs.rs
The JSON-to-SQLite migration must be atomic. We will wrap the entire data insertion in a single SQL Transaction (`BEGIN; ... COMMIT;`). 
If successful, rename `config.json` to `config.json.bak`. If the app quits halfway or panics, the transaction rolls back, leaving the database uncorrupted for the next launch attempt.

***

### Core State Management

#### [MODIFY] src-tauri/src/core/state.rs
Remove `pub config: Mutex<AppConfig>` from `AppState`. Instead, store the async `db_pool: SqlitePool` and `cached_settings: Mutex<Settings>`.

```rust
pub struct AppState {
    pub db_pool: SqlitePool,
    pub cached_settings: Mutex<Settings>,
    pub micro_countdown: Mutex<u64>,
    pub active_countdown: Mutex<u64>,
    pub timer_paused: Mutex<bool>,
    pub current_break_state: Mutex<Option<String>>,
    // ...
}
```
Update all `complete_break_logic` and Tauri command handlers to be `async fn` and execute queries directly against the `db_pool`.

***

## Verification Plan

### Automated Tests

1. **Static Analysis:**
   Run Rust checks to ensure database integration compiles and passes clippy.
   `cd src-tauri && cargo check && cargo clippy`

2. **Automated Migration Test (Integration):**
   Write a `#[tokio::test]` that generates a mock `config.json` file in a temporary directory, invokes the `migrate_json_to_db` function, and then uses a series of `SELECT` statements to `assert!` that the nested arrays (e.g., equipment inside a stretch) were parsed and saved correctly into SQLite.

3. **Concurrency Test:**
   Write a `#[tokio::test]` that simulates a timer tick (updating user progress) and a user action (saving a stretch) simultaneously using `tokio::spawn`. Assert that the `sqlx` connection pooling and SQLite's WAL mode (Write-Ahead Logging) prevent any "database is locked" errors and that both writes succeed.

### Manual Verification
1. Open the application. Ensure it loads the default tracks and settings seamlessly from the SQLite DB.
2. Modify a setting and verify the `cached_settings` and DB sync.
3. **Rollback Verification**: Force a panic mid-migration and verify `.bak` is not created and the SQLite tables remain empty.
