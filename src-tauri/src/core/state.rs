use std::sync::Mutex;
use sqlx::SqlitePool;
use super::models::{Settings, UserProgress, ReminderState};

pub struct AppState {
    pub db_pool: SqlitePool,
    pub cached_settings: Mutex<Settings>,
    pub micro_countdown: Mutex<u64>,
    pub active_countdown: Mutex<u64>,
    pub timer_paused: Mutex<bool>,
    pub reminder_state: Mutex<ReminderState>,
    pub current_break_state: Mutex<Option<String>>, // None, Some("micro"), Some("active"), Some("refocus")
    pub toggle_menu_item: Mutex<Option<tauri::menu::MenuItem<tauri::Wry>>>,
}

impl AppState {
    pub fn new(pool: SqlitePool, settings: Settings, reminder_state: ReminderState) -> Self {
        let micro_secs = settings.micro_break_interval_mins * 60;
        let active_secs = settings.active_break_interval_mins * 60;
        let is_paused = reminder_state != ReminderState::Active;
        Self {
            db_pool: pool,
            cached_settings: Mutex::new(settings),
            micro_countdown: Mutex::new(micro_secs),
            active_countdown: Mutex::new(active_secs),
            timer_paused: Mutex::new(is_paused),
            reminder_state: Mutex::new(reminder_state),
            current_break_state: Mutex::new(None),
            toggle_menu_item: Mutex::new(None),
        }
    }

    pub fn trigger_refocus_state(&self) -> Result<(), String> {
        let mut current_state = self.current_break_state.lock().map_err(|e| e.to_string())?;
        *current_state = Some("refocus".to_string());
        let mut paused = self.timer_paused.lock().map_err(|e| e.to_string())?;
        *paused = true;
        if let Some(toggle_menu_item) = self.toggle_menu_item.lock().map_err(|e| e.to_string())?.as_ref() {
            let _ = toggle_menu_item.set_text("Resume Timer");
        }
        Ok(())
    }

    pub async fn complete_break_logic(
        &self,
        action: &str,
        reference_id: Option<&str>,
        exercise_id: Option<&str>,
    ) -> Result<Option<UserProgress>, String> {
        let mut updated_progress = None;
        if action == "done" {
            let progress = crate::utils::db::increment_sessions_and_advance_level(&self.db_pool).await?;
            updated_progress = Some(progress);

            if let Some(ref_id) = reference_id {
                crate::utils::db::log_event(&self.db_pool, "session_completed", Some(ref_id), None, None).await?;
                if let Some(ex_id) = exercise_id {
                    crate::utils::db::log_event(
                        &self.db_pool,
                        "exercise_completed",
                        Some(&format!("{}-ex", ref_id)),
                        None,
                        Some(ex_id),
                    ).await?;
                }
            }
        }

        // Reset break state
        {
            let mut current_state = self.current_break_state.lock().map_err(|e| e.to_string())?;
            *current_state = None;
        }

        // Reset timers based on config settings
        {
            let settings = self.cached_settings.lock().map_err(|e| e.to_string())?;
            let mut micro = self.micro_countdown.lock().map_err(|e| e.to_string())?;
            let mut active = self.active_countdown.lock().map_err(|e| e.to_string())?;

            *micro = settings.micro_break_interval_mins * 60;
            *active = settings.active_break_interval_mins * 60;
        }

        // Resume timer tick
        {
            let mut paused = self.timer_paused.lock().map_err(|e| e.to_string())?;
            *paused = false;
            if let Some(toggle_menu_item) = self.toggle_menu_item.lock().map_err(|e| e.to_string())?.as_ref() {
                let _ = toggle_menu_item.set_text("Pause Timer");
            }
        }

        Ok(updated_progress)
    }
}
