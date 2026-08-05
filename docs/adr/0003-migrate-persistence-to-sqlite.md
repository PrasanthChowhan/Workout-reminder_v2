# 3. Migrate Persistence to SQLite Database (Async/sqlx)

* Status: accepted
* Date: 2026-08-05

## Context

The application previously stored all configurations, user progress, flashcards, reflection prompts, stretches, and track data in a single, unstructured `config.json` file. As the application scale grows, maintaining this in-memory and writing to the disk on every timer update (such as completion of break session ticks) creates I/O overhead. Furthermore, since Tauri operates on an async Tokio runtime, synchronous file writes or synchronous database calls (like `rusqlite`) block the main runtime, potentially leading to visual stutters or timer lag.

## Decision

1. **Use SQLite via `sqlx`**: Migrate the persistence layer from the `config.json` file to an embedded SQLite database using `sqlx`. `sqlx` provides native async/await connection pooling that works seamlessly with Tauri's Tokio event loop without blocking execution.
2. **Drop Mutex AppConfig Cache**: Drop the massive, global in-memory state caching for large structural datasets (such as track levels, stretches, and cards). All queries and commands will execute queries directly against the database, relying on SQLite's microsecond lookup efficiency.
3. **Cache High-Frequency Timer Parameters**: Caching only high-frequency, read-only parameters (specifically, `Settings` break intervals) in memory inside `AppState` to power the 1-second background timer loop without querying the database every second.
4. **Transactional Migration**: Implement an atomic, transactional JSON-to-SQLite migration on startup. If migration completes successfully, rename `config.json` to `config.json.bak` to preserve data safety and avoid re-runs.

## Consequences

* **Positive**: Native async execution prevents any blocking of the main UI or background timer loop.
* **Positive**: Structured schema and relational mappings for tracks, levels, custom exercises, and progress fields.
* **Positive**: Reduced I/O overhead on atomic, single-field updates.
* **Negative**: Requires handling deserialization of missing fields (e.g. adding `#[serde(default)]` to dynamic levels or vectors) during database-to-struct mapping.
