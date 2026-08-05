use std::sync::Mutex;
use sqlx::SqlitePool;
use super::models::{Settings, UserProgress};

pub struct AppState {
    pub db_pool: SqlitePool,
    pub cached_settings: Mutex<Settings>,
    pub micro_countdown: Mutex<u64>,
    pub active_countdown: Mutex<u64>,
    pub timer_paused: Mutex<bool>,
    pub current_break_state: Mutex<Option<String>>, // None, Some("micro"), Some("active"), Some("refocus")
    pub toggle_menu_item: Mutex<Option<tauri::menu::MenuItem<tauri::Wry>>>,
}

impl AppState {
    pub fn new(pool: SqlitePool, settings: Settings) -> Self {
        let micro_secs = settings.micro_break_interval_mins * 60;
        let active_secs = settings.active_break_interval_mins * 60;
        Self {
            db_pool: pool,
            cached_settings: Mutex::new(settings),
            micro_countdown: Mutex::new(micro_secs),
            active_countdown: Mutex::new(active_secs),
            timer_paused: Mutex::new(false), // Start running by default
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

    pub async fn complete_break_logic(&self, action: &str) -> Result<Option<UserProgress>, String> {
        let mut updated_progress = None;
        if action == "done" {
            let progress = crate::utils::db::increment_sessions_and_advance_level(&self.db_pool).await?;
            updated_progress = Some(progress);
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
