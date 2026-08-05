# Rust Backend Agent Rules

## Verify After Changes
- RULE-V1: After modifying ANY Rust file, run `cargo check` in `src-tauri/`.
- RULE-V2: Run `cargo clippy` before concluding your turn to catch lint issues.

## Error Handling (Show, Don't Tell)
- RULE-R1: **Zero `.unwrap()` in production code.**

```rust
// ✅ DO THIS — in functions returning Result:
let config = state.config.lock().map_err(|e| e.to_string())?;

// ✅ DO THIS — in event handlers (no Result return):
let config = state.config.lock().unwrap_or_else(|e| e.into_inner());

// ❌ NEVER THIS:
let config = state.config.lock().unwrap();
```

## Tauri Commands (Show, Don't Tell)
- RULE-R2: Commands must be **thin wrappers** (≤10 lines). Business logic → `core/state.rs`.

```rust
// ✅ DO THIS:
#[tauri::command]
pub fn complete_break(
    action: String,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    state.process_break_completion(&action, &app)
}

// ❌ NEVER THIS: 50-line command with loops, conditionals, and mutex juggling
```

## Data & Modules
- RULE-R3: No hardcoded exercise/card data in `.rs` files. Use `core/defaults.rs` or JSON assets.
- RULE-R4: Never copy-paste logic across modules. Extract to `core/` or `system/` helpers.
- RULE-R5: **Database Persistence**: Run queries asynchronously directly against `state.db_pool`. Always execute multi-table database updates transactionally (`pool.begin()`).
- RULE-R6: **Deserialization Safety**: Annotate dynamic/optional fields or vectors with `#[serde(default)]` in `core/models.rs` to allow robust decoding from SQLite rows when fields are omitted.

## Where to Put New Code
- New Tauri command → thin wrapper in `commands/`, logic in `core/state.rs`
- New data struct → `core/models.rs`
- New business logic → methods on `AppState` in `core/state.rs`
- New system integration → `system/` module
