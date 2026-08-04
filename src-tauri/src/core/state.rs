use std::sync::Mutex;
use serde_json::Value;
use super::models::AppConfig;

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub micro_countdown: Mutex<u64>,
    pub active_countdown: Mutex<u64>,
    pub timer_paused: Mutex<bool>,
    pub current_break_state: Mutex<Option<String>>, // None, Some("micro"), Some("active"), Some("refocus")
    pub toggle_menu_item: Mutex<Option<tauri::menu::MenuItem<tauri::Wry>>>,
}

impl AppState {
    pub fn new(config: AppConfig) -> Self {
        let micro_secs = config.settings.micro_break_interval_mins * 60;
        let active_secs = config.settings.active_break_interval_mins * 60;
        Self {
            config: Mutex::new(config),
            micro_countdown: Mutex::new(micro_secs),
            active_countdown: Mutex::new(active_secs),
            timer_paused: Mutex::new(false), // Start running by default
            current_break_state: Mutex::new(None),
            toggle_menu_item: Mutex::new(None),
        }
    }

    pub fn update_flashcard_metadata(&self, card_id: &str, new_metadata: Value) -> Result<AppConfig, String> {
        let mut config = self.config.lock().map_err(|e| e.to_string())?;
        if let Some(card) = config.active_recall_cards.iter_mut().find(|c| c.id == card_id) {
            let mut current_meta = card.metadata.take().unwrap_or(Value::Object(serde_json::Map::new()));
            deep_merge(&mut current_meta, new_metadata);
            card.metadata = Some(current_meta);
            Ok(config.clone())
        } else {
            Err(format!("Flashcard with ID {} not found", card_id))
        }
    }

    pub fn update_track_metadata(&self, track_id: &str, new_metadata: Value) -> Result<AppConfig, String> {
        let mut config = self.config.lock().map_err(|e| e.to_string())?;
        if let Some(track) = config.tracks.iter_mut().find(|t| t.id == track_id) {
            let mut current_meta = track.metadata.take().unwrap_or(Value::Object(serde_json::Map::new()));
            deep_merge(&mut current_meta, new_metadata);
            track.metadata = Some(current_meta);
            Ok(config.clone())
        } else {
            Err(format!("PhysicalTrack with ID {} not found", track_id))
        }
    }

    pub fn update_stretch_metadata(&self, stretch_name: &str, new_metadata: Value) -> Result<AppConfig, String> {
        let mut config = self.config.lock().map_err(|e| e.to_string())?;
        if let Some(stretch) = config.stretches.iter_mut().find(|s| s.name == stretch_name) {
            let mut current_meta = stretch.metadata.take().unwrap_or(Value::Object(serde_json::Map::new()));
            deep_merge(&mut current_meta, new_metadata);
            stretch.metadata = Some(current_meta);
            Ok(config.clone())
        } else {
            Err(format!("Stretch with name {} not found", stretch_name))
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

    pub fn complete_break_logic(&self, action: &str) -> Result<Option<AppConfig>, String> {
        let mut updated_config = None;
        if action == "done" {
            let mut config = self.config.lock().map_err(|e| e.to_string())?;
            if let Some(track_id) = config.user_progress.active_track_id.clone() {
                config.user_progress.completed_sessions_count += 1;
                config.user_progress.last_completed_at = Some(chrono::Utc::now().to_rfc3339());
                
                // Auto-advance level after 5 completed sessions if a next level exists
                if config.user_progress.completed_sessions_count >= 5 {
                    if let Some(current_level) = config.user_progress.current_level_number {
                        if let Some(track) = config.tracks.iter().find(|t| t.id == track_id) {
                            let mut next_level = current_level + 1;
                            let max_levels = track.levels.len() as u64;
                            
                            // A helper closure to check if level is excluded
                            let is_excluded = |t: &super::models::PhysicalTrack, title: &str| -> bool {
                                if let Some(metadata) = &t.metadata {
                                    if let Some(excluded) = metadata.get("excluded_exercises") {
                                        if let Some(arr) = excluded.as_array() {
                                            return arr.iter().any(|val| val.as_str() == Some(title));
                                        }
                                    }
                                }
                                false
                            };

                            while next_level <= max_levels {
                                if let Some(lvl) = track.levels.iter().find(|l| l.level_number == next_level) {
                                    if is_excluded(track, &lvl.title) {
                                        next_level += 1;
                                        continue;
                                    }
                                }
                                break;
                            }
                            if next_level <= max_levels {
                                config.user_progress.current_level_number = Some(next_level);
                                config.user_progress.completed_sessions_count = 0;
                            }
                        }
                    }
                }
                updated_config = Some(config.clone());
            }
        }

        // Reset break state
        {
            let mut current_state = self.current_break_state.lock().map_err(|e| e.to_string())?;
            *current_state = None;
        }

        // Reset timers based on config settings
        {
            let config = self.config.lock().map_err(|e| e.to_string())?;
            let mut micro = self.micro_countdown.lock().map_err(|e| e.to_string())?;
            let mut active = self.active_countdown.lock().map_err(|e| e.to_string())?;

            *micro = config.settings.micro_break_interval_mins * 60;
            *active = config.settings.active_break_interval_mins * 60;
        }

        // Resume timer tick
        {
            let mut paused = self.timer_paused.lock().map_err(|e| e.to_string())?;
            *paused = false;
            if let Some(toggle_menu_item) = self.toggle_menu_item.lock().map_err(|e| e.to_string())?.as_ref() {
                let _ = toggle_menu_item.set_text("Pause Timer");
            }
        }

        Ok(updated_config)
    }
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use crate::core::models::ActiveRecallCard;

    #[test]
    fn test_legacy_deserialization_without_metadata() {
        let legacy_json = r#"{
            "id": "legacy_card",
            "question": "What is 2+2?",
            "answer": "4",
            "category": "Math",
            "source": null
        }"#;

        let card: ActiveRecallCard = serde_json::from_str(legacy_json).unwrap();
        assert_eq!(card.id, "legacy_card");
        assert_eq!(card.question, "What is 2+2?");
        assert_eq!(card.answer, "4");
        assert_eq!(card.category, "Math");
        assert!(card.source.is_none());
        assert!(card.metadata.is_none());
    }

    #[test]
    fn test_deserialization_with_metadata() {
        let json_data = r#"{
            "id": "new_card",
            "question": "What is Rust?",
            "answer": "A language.",
            "category": "Programming",
            "source": "https://rust-lang.org",
            "metadata": {
                "difficulty": "easy",
                "reviews": 5
            }
        }"#;

        let card: ActiveRecallCard = serde_json::from_str(json_data).unwrap();
        assert_eq!(card.id, "new_card");
        let meta = card.metadata.unwrap();
        assert_eq!(meta["difficulty"], "easy");
        assert_eq!(meta["reviews"], 5);
    }

    #[test]
    fn test_deep_merge_metadata() {
        let mut target = json!({
            "difficulty": "medium",
            "tags": ["core", "rust"],
            "details": {
                "views": 10,
                "notes": "review needed"
            }
        });

        let patch = json!({
            "difficulty": "easy",
            "details": {
                "views": 11,
                "author": "Antigravity"
            },
            "new_field": "hello"
        });

        deep_merge(&mut target, patch);

        assert_eq!(target["difficulty"], "easy");
        assert_eq!(target["tags"], json!(["core", "rust"]));
        assert_eq!(target["details"]["views"], 11);
        assert_eq!(target["details"]["notes"], "review needed");
        assert_eq!(target["details"]["author"], "Antigravity");
        assert_eq!(target["new_field"], "hello");
    }
}
