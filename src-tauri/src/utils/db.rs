use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, SqlitePool, Row};
use std::path::PathBuf;
use std::str::FromStr;
use std::fs;
use serde_json::Value;
use crate::core::models::{AppConfig, Settings, ActiveRecallCard, Stretch, PhysicalTrack, CustomExercise, UserProgress, Level};

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
            "CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                micro_break_interval_mins INTEGER NOT NULL,
                active_break_interval_mins INTEGER NOT NULL,
                micro_break_duration_secs INTEGER NOT NULL,
                active_break_duration_secs INTEGER NOT NULL,
                run_at_start INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS active_recall_cards (
                id TEXT PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                category TEXT NOT NULL,
                source TEXT,
                metadata TEXT
            );

            CREATE TABLE IF NOT EXISTS reflection_prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS stretches (
                name TEXT PRIMARY KEY,
                description TEXT NOT NULL,
                duration_secs INTEGER NOT NULL,
                difficulty_level TEXT NOT NULL,
                sets INTEGER NOT NULL,
                reps TEXT,
                video_url TEXT,
                image_url TEXT,
                is_unilateral INTEGER NOT NULL,
                equipment TEXT NOT NULL,
                rest_secs INTEGER NOT NULL,
                metadata TEXT
            );

            CREATE TABLE IF NOT EXISTS physical_tracks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                metadata TEXT
            );

            CREATE TABLE IF NOT EXISTS levels (
                track_id TEXT NOT NULL,
                level_number INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                target_duration_secs INTEGER NOT NULL,
                video_url TEXT,
                image_url TEXT,
                is_unilateral INTEGER NOT NULL,
                equipment TEXT NOT NULL,
                rest_secs INTEGER NOT NULL,
                reps TEXT,
                sets INTEGER,
                PRIMARY KEY (track_id, level_number),
                FOREIGN KEY(track_id) REFERENCES physical_tracks(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_levels_track_id ON levels(track_id);

            CREATE TABLE IF NOT EXISTS custom_exercises (
                track_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                target_muscles TEXT NOT NULL,
                muscle_groups TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                duration_secs INTEGER NOT NULL,
                sets INTEGER NOT NULL,
                reps TEXT,
                reps_min INTEGER,
                reps_max INTEGER,
                video_url TEXT,
                image_url TEXT,
                is_unilateral INTEGER NOT NULL,
                equipment TEXT NOT NULL,
                rest_secs INTEGER NOT NULL,
                PRIMARY KEY (track_id, name),
                FOREIGN KEY(track_id) REFERENCES physical_tracks(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_exercises_track_id ON custom_exercises(track_id);

            CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                active_track_id TEXT,
                current_level_number INTEGER,
                onboarding_tier TEXT,
                completed_sessions_count INTEGER NOT NULL,
                last_completed_at TEXT,
                level_started_at TEXT
            );

            PRAGMA user_version = 1;"
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }
    
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn migrate_json_to_db(pool: &SqlitePool, config_path: &PathBuf) -> Result<(), String> {
    if !config_path.exists() {
        return Ok(());
    }

    let data = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let mut config: AppConfig = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    config.populate_levels();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // Check if settings already migrated to avoid duplicate logic
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM settings")
        .fetch_one(&mut *tx)
        .await
        .unwrap_or(0);

    if count == 0 {
        // 1. Settings
        sqlx::query(
            "INSERT INTO settings (id, micro_break_interval_mins, active_break_interval_mins, micro_break_duration_secs, active_break_duration_secs, run_at_start)
             VALUES (1, ?, ?, ?, ?, ?)"
        )
        .bind(config.settings.micro_break_interval_mins as i64)
        .bind(config.settings.active_break_interval_mins as i64)
        .bind(config.settings.micro_break_duration_secs as i64)
        .bind(config.settings.active_break_duration_secs as i64)
        .bind(if config.settings.run_at_start { 1 } else { 0 })
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // 2. Active Recall Cards
        for card in config.active_recall_cards {
            let metadata_str = card.metadata.as_ref().map(|m| serde_json::to_string(m).unwrap_or_default());
            sqlx::query(
                "INSERT OR REPLACE INTO active_recall_cards (id, question, answer, category, source, metadata)
                 VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(&card.id)
            .bind(&card.question)
            .bind(&card.answer)
            .bind(&card.category)
            .bind(&card.source)
            .bind(metadata_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }

        // 3. Reflection Prompts
        for prompt in config.reflection_prompts {
            sqlx::query("INSERT OR IGNORE INTO reflection_prompts (prompt) VALUES (?)")
                .bind(&prompt)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        // 4. Stretches
        for stretch in config.stretches {
            let equipment_str = serde_json::to_string(&stretch.equipment).unwrap_or_else(|_| "[]".to_string());
            let metadata_str = stretch.metadata.as_ref().map(|m| serde_json::to_string(m).unwrap_or_default());
            sqlx::query(
                "INSERT OR REPLACE INTO stretches (name, description, duration_secs, difficulty_level, sets, reps, video_url, image_url, is_unilateral, equipment, rest_secs, metadata)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            )
            .bind(&stretch.name)
            .bind(&stretch.description)
            .bind(stretch.duration_secs as i64)
            .bind(&stretch.difficulty_level)
            .bind(stretch.sets as i64)
            .bind(&stretch.reps)
            .bind(&stretch.video_url)
            .bind(&stretch.image_url)
            .bind(if stretch.is_unilateral { 1 } else { 0 })
            .bind(equipment_str)
            .bind(stretch.rest_secs as i64)
            .bind(metadata_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }

        // 5. Tracks, Levels, Custom Exercises
        for track in config.tracks {
            let metadata_str = track.metadata.as_ref().map(|m| serde_json::to_string(m).unwrap_or_default());
            sqlx::query(
                "INSERT OR REPLACE INTO physical_tracks (id, name, description, metadata)
                 VALUES (?, ?, ?, ?)"
            )
            .bind(&track.id)
            .bind(&track.name)
            .bind(&track.description)
            .bind(metadata_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

            for level in track.levels {
                let equipment_str = serde_json::to_string(&level.equipment).unwrap_or_else(|_| "[]".to_string());
                sqlx::query(
                    "INSERT OR REPLACE INTO levels (track_id, level_number, title, description, target_duration_secs, video_url, image_url, is_unilateral, equipment, rest_secs, reps, sets)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                )
                .bind(&track.id)
                .bind(level.level_number as i64)
                .bind(&level.title)
                .bind(&level.description)
                .bind(level.target_duration_secs as i64)
                .bind(&level.video_url)
                .bind(&level.image_url)
                .bind(if level.is_unilateral { 1 } else { 0 })
                .bind(equipment_str)
                .bind(level.rest_secs as i64)
                .bind(&level.reps)
                .bind(level.sets.map(|s| s as i64))
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
            }

            if let Some(exercises) = track.exercises {
                for ex in exercises {
                    let target_muscles_str = serde_json::to_string(&ex.target_muscles).unwrap_or_else(|_| "[]".to_string());
                    let muscle_groups_str = serde_json::to_string(&ex.muscle_groups).unwrap_or_else(|_| "[]".to_string());
                    let equipment_str = serde_json::to_string(&ex.equipment).unwrap_or_else(|_| "[]".to_string());
                    sqlx::query(
                        "INSERT OR REPLACE INTO custom_exercises (track_id, name, description, category, target_muscles, muscle_groups, difficulty, duration_secs, sets, reps, reps_min, reps_max, video_url, image_url, is_unilateral, equipment, rest_secs)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                    )
                    .bind(&track.id)
                    .bind(&ex.name)
                    .bind(&ex.description)
                    .bind(&ex.category)
                    .bind(target_muscles_str)
                    .bind(muscle_groups_str)
                    .bind(&ex.difficulty)
                    .bind(ex.duration_secs as i64)
                    .bind(ex.sets as i64)
                    .bind(&ex.reps)
                    .bind(ex.reps_min.map(|r| r as i64))
                    .bind(ex.reps_max.map(|r| r as i64))
                    .bind(&ex.video_url)
                    .bind(&ex.image_url)
                    .bind(if ex.is_unilateral { 1 } else { 0 })
                    .bind(equipment_str)
                    .bind(ex.rest_secs as i64)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
                }
            }
        }

        // 6. User Progress
        sqlx::query(
            "INSERT INTO user_progress (id, active_track_id, current_level_number, onboarding_tier, completed_sessions_count, last_completed_at, level_started_at)
             VALUES (1, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&config.user_progress.active_track_id)
        .bind(config.user_progress.current_level_number.map(|l| l as i64))
        .bind(&config.user_progress.onboarding_tier)
        .bind(config.user_progress.completed_sessions_count as i64)
        .bind(&config.user_progress.last_completed_at)
        .bind(&config.user_progress.level_started_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    // Rename config.json to config.json.bak
    let mut bak_path = config_path.clone();
    bak_path.set_extension("json.bak");
    if let Err(e) = fs::rename(config_path, &bak_path) {
        eprintln!("Failed to rename config file: {}", e);
    }

    Ok(())
}

pub async fn load_settings(pool: &SqlitePool) -> Result<Settings, String> {
    let row = sqlx::query("SELECT micro_break_interval_mins, active_break_interval_mins, micro_break_duration_secs, active_break_duration_secs, run_at_start FROM settings WHERE id = 1")
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(r) = row {
        let run_at_start_int: i32 = r.get("run_at_start");
        Ok(Settings {
            micro_break_interval_mins: r.get::<i64, _>("micro_break_interval_mins") as u64,
            active_break_interval_mins: r.get::<i64, _>("active_break_interval_mins") as u64,
            micro_break_duration_secs: r.get::<i64, _>("micro_break_duration_secs") as u64,
            active_break_duration_secs: r.get::<i64, _>("active_break_duration_secs") as u64,
            run_at_start: run_at_start_int != 0,
        })
    } else {
        Ok(AppConfig::default().settings)
    }
}


pub async fn load_user_progress(pool: &SqlitePool) -> Result<UserProgress, String> {
    let row = sqlx::query("SELECT active_track_id, current_level_number, onboarding_tier, completed_sessions_count, last_completed_at, level_started_at FROM user_progress WHERE id = 1")
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(r) = row {
        let current_level_number_val: Option<i64> = r.get("current_level_number");
        Ok(UserProgress {
            active_track_id: r.get("active_track_id"),
            current_level_number: current_level_number_val.map(|l| l as u64),
            onboarding_tier: r.get("onboarding_tier"),
            completed_sessions_count: r.get::<i64, _>("completed_sessions_count") as u64,
            last_completed_at: r.get("last_completed_at"),
            level_started_at: r.get("level_started_at"),
        })
    } else {
        Ok(AppConfig::default().user_progress)
    }
}

pub async fn save_user_progress(pool: &SqlitePool, progress: &UserProgress) -> Result<(), String> {
    sqlx::query("INSERT OR REPLACE INTO user_progress (id, active_track_id, current_level_number, onboarding_tier, completed_sessions_count, last_completed_at, level_started_at) VALUES (1, ?, ?, ?, ?, ?, ?)")
        .bind(&progress.active_track_id)
        .bind(progress.current_level_number.map(|l| l as i64))
        .bind(&progress.onboarding_tier)
        .bind(progress.completed_sessions_count as i64)
        .bind(&progress.last_completed_at)
        .bind(&progress.level_started_at)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn deep_merge(a: &mut Value, b: Value) {
    match (a, b) {
        (Value::Object(a), Value::Object(b)) => {
            for (k, v) in b {
                if v.is_null() {
                    a.remove(&k);
                } else {
                    deep_merge(a.entry(k).or_insert(Value::Null), v);
                }
            }
        }
        (a, b) => {
            *a = b;
        }
    }
}

pub async fn update_flashcard_meta(pool: &SqlitePool, card_id: &str, new_metadata: Value) -> Result<(), String> {
    let row = sqlx::query("SELECT metadata FROM active_recall_cards WHERE id = ?")
        .bind(card_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(r) = row {
        let metadata_str: Option<String> = r.get("metadata");
        let mut current_meta = metadata_str
            .and_then(|s| serde_json::from_str::<Value>(&s).ok())
            .unwrap_or_else(|| Value::Object(serde_json::Map::new()));
        
        deep_merge(&mut current_meta, new_metadata);
        
        let new_meta_str = serde_json::to_string(&current_meta).unwrap_or_default();
        sqlx::query("UPDATE active_recall_cards SET metadata = ? WHERE id = ?")
            .bind(new_meta_str)
            .bind(card_id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Flashcard with ID {} not found", card_id))
    }
}

pub async fn update_track_meta(pool: &SqlitePool, track_id: &str, new_metadata: Value) -> Result<(), String> {
    let row = sqlx::query("SELECT metadata FROM physical_tracks WHERE id = ?")
        .bind(track_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(r) = row {
        let metadata_str: Option<String> = r.get("metadata");
        let mut current_meta = metadata_str
            .and_then(|s| serde_json::from_str::<Value>(&s).ok())
            .unwrap_or_else(|| Value::Object(serde_json::Map::new()));
        
        deep_merge(&mut current_meta, new_metadata);
        
        let new_meta_str = serde_json::to_string(&current_meta).unwrap_or_default();
        sqlx::query("UPDATE physical_tracks SET metadata = ? WHERE id = ?")
            .bind(new_meta_str)
            .bind(track_id)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("PhysicalTrack with ID {} not found", track_id))
    }
}

pub async fn update_stretch_meta(pool: &SqlitePool, stretch_name: &str, new_metadata: Value) -> Result<(), String> {
    let row = sqlx::query("SELECT metadata FROM stretches WHERE name = ?")
        .bind(stretch_name)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(r) = row {
        let metadata_str: Option<String> = r.get("metadata");
        let mut current_meta = metadata_str
            .and_then(|s| serde_json::from_str::<Value>(&s).ok())
            .unwrap_or_else(|| Value::Object(serde_json::Map::new()));
        
        deep_merge(&mut current_meta, new_metadata);
        
        let new_meta_str = serde_json::to_string(&current_meta).unwrap_or_default();
        sqlx::query("UPDATE stretches SET metadata = ? WHERE name = ?")
            .bind(new_meta_str)
            .bind(stretch_name)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Stretch with name {} not found", stretch_name))
    }
}

pub async fn increment_sessions_and_advance_level(pool: &SqlitePool) -> Result<UserProgress, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    
    let row = sqlx::query("SELECT active_track_id, current_level_number, onboarding_tier, completed_sessions_count, last_completed_at, level_started_at FROM user_progress WHERE id = 1")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
        
    let active_track_id: Option<String> = row.get("active_track_id");
    let mut current_level_number: Option<i64> = row.get("current_level_number");
    let onboarding_tier: Option<String> = row.get("onboarding_tier");
    let mut completed_sessions_count: i64 = row.get("completed_sessions_count");
    
    completed_sessions_count += 1;
    let last_completed_at = Some(chrono::Utc::now().to_rfc3339());
    let mut level_started_at: Option<String> = row.get("level_started_at");
    
    if completed_sessions_count >= 5 {
        if let (Some(ref track_id), Some(curr_lvl)) = (&active_track_id, current_level_number) {
            // Load track metadata to check excluded exercises
            let track_row = sqlx::query("SELECT metadata FROM physical_tracks WHERE id = ?")
                .bind(track_id)
                .fetch_optional(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
                
            let mut excluded_exercises = Vec::new();
            if let Some(tr) = track_row {
                let metadata_str: Option<String> = tr.get("metadata");
                if let Some(metadata) = metadata_str.and_then(|s| serde_json::from_str::<Value>(&s).ok()) {
                    if let Some(excluded) = metadata.get("excluded_exercises") {
                        if let Some(arr) = excluded.as_array() {
                            excluded_exercises = arr.iter().filter_map(|val| val.as_str().map(|s| s.to_string())).collect();
                        }
                    }
                }
            }
            
            // Get all level titles & level numbers for this track
            let levels = sqlx::query("SELECT level_number, title FROM levels WHERE track_id = ? ORDER BY level_number")
                .bind(track_id)
                .fetch_all(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
                
            let max_levels = levels.len() as i64;
            let mut next_level = curr_lvl + 1;
            
            while next_level <= max_levels {
                if let Some(lvl) = levels.iter().find(|l| l.get::<i64, _>("level_number") == next_level) {
                    let title: String = lvl.get("title");
                    if excluded_exercises.contains(&title) {
                        next_level += 1;
                        continue;
                    }
                }
                break;
            }
            
            if next_level <= max_levels {
                current_level_number = Some(next_level);
                completed_sessions_count = 0;
                level_started_at = Some(chrono::Utc::now().to_rfc3339());
            }
        }
    }
    
    sqlx::query("UPDATE user_progress SET completed_sessions_count = ?, last_completed_at = ?, current_level_number = ?, level_started_at = ? WHERE id = 1")
        .bind(completed_sessions_count)
        .bind(&last_completed_at)
        .bind(current_level_number)
        .bind(&level_started_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
        
    tx.commit().await.map_err(|e| e.to_string())?;
    
    Ok(UserProgress {
        active_track_id,
        current_level_number: current_level_number.map(|l| l as u64),
        onboarding_tier,
        completed_sessions_count: completed_sessions_count as u64,
        last_completed_at,
        level_started_at,
    })
}

pub async fn load_app_config(pool: &SqlitePool) -> Result<AppConfig, String> {
    // 1. Settings
    let settings = load_settings(pool).await?;

    // 2. Active Recall Cards
    let active_recall_cards = sqlx::query("SELECT id, question, answer, category, source, metadata FROM active_recall_cards")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|row| {
            let metadata_str: Option<String> = row.get("metadata");
            let metadata: Option<Value> = metadata_str.and_then(|s| serde_json::from_str(&s).ok());
            ActiveRecallCard {
                id: row.get("id"),
                question: row.get("question"),
                answer: row.get("answer"),
                category: row.get("category"),
                source: row.get("source"),
                metadata,
            }
        })
        .collect::<Vec<_>>();

    // 3. Reflection Prompts
    let reflection_prompts = sqlx::query("SELECT prompt FROM reflection_prompts")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|row| row.get("prompt"))
        .collect::<Vec<_>>();

    // 4. Stretches
    let stretches = sqlx::query("SELECT name, description, duration_secs, difficulty_level, sets, reps, video_url, image_url, is_unilateral, equipment, rest_secs, metadata FROM stretches")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|row| {
            let equipment_str: String = row.get("equipment");
            let equipment: Vec<String> = serde_json::from_str(&equipment_str).unwrap_or_default();
            let metadata_str: Option<String> = row.get("metadata");
            let metadata: Option<Value> = metadata_str.and_then(|s| serde_json::from_str(&s).ok());
            let is_unilateral_int: i32 = row.get("is_unilateral");
            Stretch {
                name: row.get("name"),
                description: row.get("description"),
                duration_secs: row.get::<i64, _>("duration_secs") as u64,
                difficulty_level: row.get("difficulty_level"),
                sets: row.get::<i64, _>("sets") as u64,
                reps: row.get("reps"),
                video_url: row.get("video_url"),
                image_url: row.get("image_url"),
                is_unilateral: is_unilateral_int != 0,
                equipment,
                rest_secs: row.get::<i64, _>("rest_secs") as u64,
                metadata,
            }
        })
        .collect::<Vec<_>>();

    // 5. Tracks
    let mut tracks = Vec::new();
    let track_rows = sqlx::query("SELECT id, name, description, metadata FROM physical_tracks")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    for row in track_rows {
        let id: String = row.get("id");
        let name: String = row.get("name");
        let description: String = row.get("description");
        let metadata_str: Option<String> = row.get("metadata");
        let metadata: Option<Value> = metadata_str.and_then(|s| serde_json::from_str(&s).ok());

        // Levels
        let levels = sqlx::query("SELECT level_number, title, description, target_duration_secs, video_url, image_url, is_unilateral, equipment, rest_secs, reps, sets FROM levels WHERE track_id = ? ORDER BY level_number")
            .bind(&id)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?
            .into_iter()
            .map(|l_row| {
                let equipment_str: String = l_row.get("equipment");
                let equipment: Vec<String> = serde_json::from_str(&equipment_str).unwrap_or_default();
                let is_unilateral_int: i32 = l_row.get("is_unilateral");
                let sets_val: Option<i64> = l_row.get("sets");
                Level {
                    level_number: l_row.get::<i64, _>("level_number") as u64,
                    title: l_row.get("title"),
                    description: l_row.get("description"),
                    target_duration_secs: l_row.get::<i64, _>("target_duration_secs") as u64,
                    video_url: l_row.get("video_url"),
                    image_url: l_row.get("image_url"),
                    is_unilateral: is_unilateral_int != 0,
                    equipment,
                    rest_secs: l_row.get::<i64, _>("rest_secs") as u64,
                    reps: l_row.get("reps"),
                    sets: sets_val.map(|s| s as u64),
                }
            })
            .collect::<Vec<_>>();

        // Custom Exercises
        let custom_exercises = sqlx::query("SELECT name, description, category, target_muscles, muscle_groups, difficulty, duration_secs, sets, reps, reps_min, reps_max, video_url, image_url, is_unilateral, equipment, rest_secs FROM custom_exercises WHERE track_id = ?")
            .bind(&id)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?;

        let exercises = if custom_exercises.is_empty() {
            None
        } else {
            Some(custom_exercises.into_iter().map(|e_row| {
                let target_muscles_str: String = e_row.get("target_muscles");
                let target_muscles: Vec<String> = serde_json::from_str(&target_muscles_str).unwrap_or_default();
                let muscle_groups_str: String = e_row.get("muscle_groups");
                let muscle_groups: Vec<String> = serde_json::from_str(&muscle_groups_str).unwrap_or_default();
                let equipment_str: String = e_row.get("equipment");
                let equipment: Vec<String> = serde_json::from_str(&equipment_str).unwrap_or_default();
                let is_unilateral_int: i32 = e_row.get("is_unilateral");
                let reps_min_val: Option<i64> = e_row.get("reps_min");
                let reps_max_val: Option<i64> = e_row.get("reps_max");
                CustomExercise {
                    name: e_row.get("name"),
                    description: e_row.get("description"),
                    category: e_row.get("category"),
                    target_muscles,
                    muscle_groups,
                    difficulty: e_row.get("difficulty"),
                    duration_secs: e_row.get::<i64, _>("duration_secs") as u64,
                    sets: e_row.get::<i64, _>("sets") as u64,
                    reps: e_row.get("reps"),
                    reps_min: reps_min_val.map(|r| r as u64),
                    reps_max: reps_max_val.map(|r| r as u64),
                    video_url: e_row.get("video_url"),
                    image_url: e_row.get("image_url"),
                    is_unilateral: is_unilateral_int != 0,
                    equipment,
                    rest_secs: e_row.get::<i64, _>("rest_secs") as u64,
                }
            }).collect::<Vec<_>>())
        };

        tracks.push(PhysicalTrack {
            id,
            name,
            description,
            levels,
            exercises,
            metadata,
        });
    }

    // 6. User Progress
    let user_progress = load_user_progress(pool).await?;

    Ok(AppConfig {
        settings,
        active_recall_cards,
        reflection_prompts,
        stretches,
        tracks,
        user_progress,
    })
}

pub async fn save_app_config(pool: &SqlitePool, config: &AppConfig) -> Result<(), String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. Settings
    sqlx::query("INSERT OR REPLACE INTO settings (id, micro_break_interval_mins, active_break_interval_mins, micro_break_duration_secs, active_break_duration_secs, run_at_start) VALUES (1, ?, ?, ?, ?, ?)")
        .bind(config.settings.micro_break_interval_mins as i64)
        .bind(config.settings.active_break_interval_mins as i64)
        .bind(config.settings.micro_break_duration_secs as i64)
        .bind(config.settings.active_break_duration_secs as i64)
        .bind(if config.settings.run_at_start { 1 } else { 0 })
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // 2. Active Recall Cards
    sqlx::query("DELETE FROM active_recall_cards").execute(&mut *tx).await.map_err(|e| e.to_string())?;
    for card in &config.active_recall_cards {
        let metadata_str = card.metadata.as_ref().map(|m| serde_json::to_string(m).unwrap_or_default());
        sqlx::query("INSERT INTO active_recall_cards (id, question, answer, category, source, metadata) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(&card.id)
            .bind(&card.question)
            .bind(&card.answer)
            .bind(&card.category)
            .bind(&card.source)
            .bind(metadata_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 3. Reflection Prompts
    sqlx::query("DELETE FROM reflection_prompts").execute(&mut *tx).await.map_err(|e| e.to_string())?;
    for prompt in &config.reflection_prompts {
        sqlx::query("INSERT INTO reflection_prompts (prompt) VALUES (?)")
            .bind(prompt)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 4. Stretches
    sqlx::query("DELETE FROM stretches").execute(&mut *tx).await.map_err(|e| e.to_string())?;
    for stretch in &config.stretches {
        let equipment_str = serde_json::to_string(&stretch.equipment).unwrap_or_else(|_| "[]".to_string());
        let metadata_str = stretch.metadata.as_ref().map(|m| serde_json::to_string(m).unwrap_or_default());
        sqlx::query("INSERT INTO stretches (name, description, duration_secs, difficulty_level, sets, reps, video_url, image_url, is_unilateral, equipment, rest_secs, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&stretch.name)
            .bind(&stretch.description)
            .bind(stretch.duration_secs as i64)
            .bind(&stretch.difficulty_level)
            .bind(stretch.sets as i64)
            .bind(&stretch.reps)
            .bind(&stretch.video_url)
            .bind(&stretch.image_url)
            .bind(if stretch.is_unilateral { 1 } else { 0 })
            .bind(equipment_str)
            .bind(stretch.rest_secs as i64)
            .bind(metadata_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    // 5. Tracks, levels, exercises
    sqlx::query("DELETE FROM levels").execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM custom_exercises").execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM physical_tracks").execute(&mut *tx).await.map_err(|e| e.to_string())?;

    for track in &config.tracks {
        let metadata_str = track.metadata.as_ref().map(|m| serde_json::to_string(m).unwrap_or_default());
        sqlx::query("INSERT INTO physical_tracks (id, name, description, metadata) VALUES (?, ?, ?, ?)")
            .bind(&track.id)
            .bind(&track.name)
            .bind(&track.description)
            .bind(metadata_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        for level in &track.levels {
            let equipment_str = serde_json::to_string(&level.equipment).unwrap_or_else(|_| "[]".to_string());
            sqlx::query("INSERT INTO levels (track_id, level_number, title, description, target_duration_secs, video_url, image_url, is_unilateral, equipment, rest_secs, reps, sets) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(&track.id)
                .bind(level.level_number as i64)
                .bind(&level.title)
                .bind(&level.description)
                .bind(level.target_duration_secs as i64)
                .bind(&level.video_url)
                .bind(&level.image_url)
                .bind(if level.is_unilateral { 1 } else { 0 })
                .bind(equipment_str)
                .bind(level.rest_secs as i64)
                .bind(&level.reps)
                .bind(level.sets.map(|s| s as i64))
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        if let Some(ref exercises) = track.exercises {
            for ex in exercises {
                let target_muscles_str = serde_json::to_string(&ex.target_muscles).unwrap_or_else(|_| "[]".to_string());
                let muscle_groups_str = serde_json::to_string(&ex.muscle_groups).unwrap_or_else(|_| "[]".to_string());
                let equipment_str = serde_json::to_string(&ex.equipment).unwrap_or_else(|_| "[]".to_string());
                sqlx::query("INSERT INTO custom_exercises (track_id, name, description, category, target_muscles, muscle_groups, difficulty, duration_secs, sets, reps, reps_min, reps_max, video_url, image_url, is_unilateral, equipment, rest_secs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                    .bind(&track.id)
                    .bind(&ex.name)
                    .bind(&ex.description)
                    .bind(&ex.category)
                    .bind(target_muscles_str)
                    .bind(muscle_groups_str)
                    .bind(&ex.difficulty)
                    .bind(ex.duration_secs as i64)
                    .bind(ex.sets as i64)
                    .bind(&ex.reps)
                    .bind(ex.reps_min.map(|r| r as i64))
                    .bind(ex.reps_max.map(|r| r as i64))
                    .bind(&ex.video_url)
                    .bind(&ex.image_url)
                    .bind(if ex.is_unilateral { 1 } else { 0 })
                    .bind(equipment_str)
                    .bind(ex.rest_secs as i64)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    // 6. User Progress
    sqlx::query("INSERT OR REPLACE INTO user_progress (id, active_track_id, current_level_number, onboarding_tier, completed_sessions_count, last_completed_at, level_started_at) VALUES (1, ?, ?, ?, ?, ?, ?)")
        .bind(&config.user_progress.active_track_id)
        .bind(config.user_progress.current_level_number.map(|l| l as i64))
        .bind(&config.user_progress.onboarding_tier)
        .bind(config.user_progress.completed_sessions_count as i64)
        .bind(&config.user_progress.last_completed_at)
        .bind(&config.user_progress.level_started_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::SystemTime;

    #[tokio::test]
    async fn test_database_migration_from_json() {
        let timestamp = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs();
        let temp_dir = std::env::temp_dir().join(format!("workout_test_{}", timestamp));
        std::fs::create_dir_all(&temp_dir).unwrap();
        
        let pool = init_db(&temp_dir).await.unwrap();
        
        let config_path = temp_dir.join("config.json");
        let default_config = AppConfig::default();
        let json_str = serde_json::to_string(&default_config).unwrap();
        std::fs::write(&config_path, json_str).unwrap();

        migrate_json_to_db(&pool, &config_path).await.unwrap();

        // Check if config.json.bak was created
        let mut bak_path = config_path.clone();
        bak_path.set_extension("json.bak");
        assert!(bak_path.exists());
        assert!(!config_path.exists());

        // Validate retrieved config from DB matches original
        let loaded = load_app_config(&pool).await.unwrap();
        assert_eq!(loaded.settings.micro_break_interval_mins, default_config.settings.micro_break_interval_mins);
        assert_eq!(loaded.settings.active_break_interval_mins, default_config.settings.active_break_interval_mins);
        assert_eq!(loaded.active_recall_cards.len(), default_config.active_recall_cards.len());
        assert_eq!(loaded.stretches.len(), default_config.stretches.len());

        // Cleanup
        let _ = std::fs::remove_dir_all(temp_dir);
    }
}
