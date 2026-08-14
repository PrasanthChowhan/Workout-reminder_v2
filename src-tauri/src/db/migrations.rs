use sqlx::SqlitePool;

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), String> {
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

    if version < 2 {
        sqlx::query(
            "ALTER TABLE custom_exercises ADD COLUMN id TEXT;
             ALTER TABLE custom_exercises ADD COLUMN execution_notes TEXT;

             UPDATE custom_exercises SET id = 'ex_sciatic_nerve_slider', execution_notes = 'Perform 10-15 slow, dynamic repetitions per leg. Keep movement controlled.' WHERE track_id = 'split_training_program' AND name = 'Sciatic Nerve Slider';
             UPDATE custom_exercises SET id = 'ex_low_lunge_posterior_pelvic_tilt', execution_notes = '30-60s hold per leg. Focus on tilting the pelvis posteriorly.', reps = NULL, reps_min = NULL, reps_max = NULL WHERE track_id = 'split_training_program' AND name = 'Low Lunge with Posterior Pelvic Tilt';
             UPDATE custom_exercises SET id = 'ex_half_split_flat_back', execution_notes = '30-60s hold per leg. Keep the back flat and hips square.', reps = NULL, reps_min = NULL, reps_max = NULL WHERE track_id = 'split_training_program' AND name = 'Half Split (Flat Back)';
             UPDATE custom_exercises SET id = 'ex_cossack_squat', execution_notes = '8-10 reps per side. Keep the heel of the working leg flat on the floor.' WHERE track_id = 'split_training_program' AND name = 'Cossack Squat';
             UPDATE custom_exercises SET id = 'ex_frog_stretch', execution_notes = '60-120s hold. Keep knees wide and ankles in line with knees.', reps = NULL, reps_min = NULL, reps_max = NULL WHERE track_id = 'split_training_program' AND name = 'Frog Stretch';
             UPDATE custom_exercises SET id = 'ex_pancake_stretch', execution_notes = '60s hold. Tilt from the pelvis, keeping the spine as long as possible.', reps = NULL, reps_min = NULL, reps_max = NULL WHERE track_id = 'split_training_program' AND name = 'Pancake Stretch';
             UPDATE custom_exercises SET id = 'ex_assisted_front_split', execution_notes = '30-60s hold per leg. Use blocks or pillows to support hips as needed.', reps = NULL, reps_min = NULL, reps_max = NULL WHERE track_id = 'split_training_program' AND name = 'Assisted Front Split (with Blocks/Pillows)';
             UPDATE custom_exercises SET id = 'ex_wall_middle_split', execution_notes = '2-3 min hold. Relax the legs and let gravity gently increase the stretch.', reps = NULL, reps_min = NULL, reps_max = NULL WHERE track_id = 'split_training_program' AND name = 'Wall Middle Split';

             PRAGMA user_version = 2;"
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 3 {
        sqlx::query(
            "DROP TABLE IF EXISTS active_recall_cards;

             CREATE TABLE recall_concepts (
                 concept_id TEXT PRIMARY KEY,
                 concept_title TEXT NOT NULL,
                 tags TEXT NOT NULL,
                 source_title TEXT,
                 source_url TEXT
             );

             CREATE TABLE recall_variants (
                 variant_id TEXT PRIMARY KEY,
                 concept_id TEXT NOT NULL,
                 difficulty_level TEXT NOT NULL,
                 scenario_prose TEXT NOT NULL,
                 scenario_code_snippet TEXT,
                 hint TEXT NOT NULL,
                 target_answer_prose TEXT NOT NULL,
                 target_answer_code TEXT,
                 common_trap TEXT NOT NULL,
                 explanation TEXT NOT NULL,
                 due_date TEXT NOT NULL,
                 stability REAL NOT NULL,
                 difficulty REAL NOT NULL,
                 elapsed_days INTEGER NOT NULL,
                 scheduled_days INTEGER NOT NULL,
                 reps INTEGER NOT NULL,
                 lapses INTEGER NOT NULL,
                 state INTEGER NOT NULL,
                 last_review TEXT,
                 FOREIGN KEY(concept_id) REFERENCES recall_concepts(concept_id) ON DELETE CASCADE
             );
             CREATE INDEX IF NOT EXISTS idx_variants_concept_id ON recall_variants(concept_id);
             
             PRAGMA user_version = 3;"
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 4 {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                occurred_at INTEGER NOT NULL,        -- Unix epoch milliseconds
                local_date TEXT NOT NULL,            -- YYYY-MM-DD in user local timezone
                reference_id TEXT,
                fsrs_grade INTEGER,
                metadata TEXT,
                UNIQUE(event_type, reference_id)     -- Enforces strict idempotency
            );

            CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_log(occurred_at);
            CREATE INDEX IF NOT EXISTS idx_activity_local_date ON activity_log(local_date);

            PRAGMA user_version = 4;"
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 5 {
        sqlx::query(
            "ALTER TABLE settings ADD COLUMN reminder_state_type TEXT NOT NULL DEFAULT 'Active';
             ALTER TABLE settings ADD COLUMN paused_until TEXT;
             PRAGMA user_version = 5;"
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    if version < 6 {
        sqlx::query(
            "ALTER TABLE settings ADD COLUMN daily_prompt TEXT NOT NULL DEFAULT 'Have you read the book of king?';
             ALTER TABLE settings ADD COLUMN daily_prompt_enabled INTEGER NOT NULL DEFAULT 0;
             PRAGMA user_version = 6;"
        ).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
