use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveRecallCard {
    pub id: String,
    pub question: String,
    pub answer: String,
    pub category: String,
    pub source: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stretch {
    pub name: String,
    pub description: String,
    pub duration_secs: u64,
    #[serde(default = "default_difficulty")]
    pub difficulty_level: String,
    #[serde(default = "default_sets")]
    pub sets: u64,
    #[serde(default)]
    pub reps: Option<String>,
    #[serde(alias = "url")]
    pub video_url: Option<String>,
    pub image_url: Option<String>,
    #[serde(default)]
    pub is_unilateral: bool,
    #[serde(default)]
    pub equipment: Vec<String>,
    #[serde(default)]
    pub rest_secs: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
}

fn default_difficulty() -> String {
    "All Levels".to_string()
}

fn default_sets() -> u64 {
    1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Level {
    pub level_number: u64,
    pub title: String,
    pub description: String,
    pub target_duration_secs: u64,
    #[serde(alias = "url")]
    pub video_url: Option<String>,
    pub image_url: Option<String>,
    #[serde(default)]
    pub is_unilateral: bool,
    #[serde(default)]
    pub equipment: Vec<String>,
    #[serde(default)]
    pub rest_secs: u64,
    #[serde(default)]
    pub reps: Option<String>,
    #[serde(default)]
    pub sets: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomExercise {
    pub name: String,
    pub description: String,
    pub category: String,
    #[serde(default)]
    pub target_muscles: Vec<String>,
    #[serde(default)]
    #[serde(alias = "muscle_groups")]
    pub muscle_groups: Vec<String>,
    pub difficulty: String,
    pub duration_secs: u64,
    #[serde(default = "default_sets")]
    pub sets: u64,
    pub reps: Option<String>,
    #[serde(default)]
    pub reps_min: Option<u64>,
    #[serde(default)]
    pub reps_max: Option<u64>,
    #[serde(alias = "url")]
    pub video_url: Option<String>,
    pub image_url: Option<String>,
    #[serde(default)]
    pub is_unilateral: bool,
    #[serde(default)]
    pub equipment: Vec<String>,
    #[serde(default)]
    pub rest_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicalTrack {
    pub id: String,
    pub name: String,
    pub description: String,
    pub levels: Vec<Level>,
    #[serde(default)]
    pub exercises: Option<Vec<CustomExercise>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProgress {
    pub active_track_id: Option<String>,
    pub current_level_number: Option<u64>,
    pub onboarding_tier: Option<String>,
    pub completed_sessions_count: u64,
    pub last_completed_at: Option<String>,
    pub level_started_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub micro_break_interval_mins: u64,
    pub active_break_interval_mins: u64,
    pub micro_break_duration_secs: u64,
    pub active_break_duration_secs: u64,
    pub run_at_start: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub settings: Settings,
    pub active_recall_cards: Vec<ActiveRecallCard>,
    pub reflection_prompts: Vec<String>,
    pub stretches: Vec<Stretch>,
    pub tracks: Vec<PhysicalTrack>,
    pub user_progress: UserProgress,
}

impl Default for AppConfig {
    fn default() -> Self {
        let mut config = Self {
            settings: Settings {
                micro_break_interval_mins: 20,
                active_break_interval_mins: 50,
                micro_break_duration_secs: 20,
                active_break_duration_secs: 300, // 5 minutes
                run_at_start: false,
            },
            active_recall_cards: vec![
                ActiveRecallCard {
                    id: "card_rust_lifetime".to_string(),
                    question: "What is a Lifetime in Rust?".to_string(),
                    answer: "A lifetime is a construct the compiler uses to ensure all borrows are valid and that data isn't dropped while it's still being used.".to_string(),
                    category: "Rust".to_string(),
                    source: Some("https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html".to_string()),
                    metadata: None,
                },
                ActiveRecallCard {
                    id: "2".to_string(),
                    question: "String vs &str: What is the difference in Rust?".to_string(),
                    answer: "String is an owned, growable UTF-8 buffer on the heap. &str is an immutable borrow/view of a UTF-8 string that points to stack, heap, or static memory.".to_string(),
                    category: "Rust".to_string(),
                    source: None,
                    metadata: None,
                },
                ActiveRecallCard {
                    id: "3".to_string(),
                    question: "What is the CAP Theorem?".to_string(),
                    answer: "A distributed system can guarantee at most two of: Consistency (every read gets recent data), Availability (every request gets a non-error response), and Partition Tolerance (system functions despite networking splits).".to_string(),
                    category: "System Design".to_string(),
                    source: None,
                    metadata: None,
                },
                ActiveRecallCard {
                    id: "4".to_string(),
                    question: "What does deep module design mean?".to_string(),
                    answer: "A deep module has a simple interface (few methods) but hides a large amount of complex implementation/behavior behind it, maximizing code leverage.".to_string(),
                    category: "Software Design".to_string(),
                    source: None,
                    metadata: None,
                }
            ],
            reflection_prompts: vec![
                "What is the core problem you are solving right now? Is there a simpler way?".to_string(),
                "Are you stuck down a rabbit hole? Zoom out and state your goal in one sentence.".to_string(),
                "Is there a simpler data structure or logic block that solves this?".to_string(),
                "If you had to delete 50% of the code you just wrote, which part would it be?".to_string(),
            ],
            stretches: vec![
                Stretch {
                    name: "Physical Reset".to_string(),
                    description: "Stand up, roll shoulders backward 10 times, and stretch arms high overhead to realign posture and improve blood flow.".to_string(),
                    duration_secs: 30,
                    difficulty_level: "Beginner".to_string(),
                    sets: 2,
                    reps: Some("10 reps".to_string()),
                    video_url: None,
                    image_url: None,
                    is_unilateral: false,
                    equipment: vec![],
                    rest_secs: 15,
                    metadata: None,
                },
                Stretch {
                    name: "Neck & Spine Reset".to_string(),
                    description: "Sit tall. Turn chin slowly to right shoulder for 5s, then left shoulder for 5s. Roll neck gently.".to_string(),
                    duration_secs: 30,
                    difficulty_level: "Beginner".to_string(),
                    sets: 2,
                    reps: Some("Hold 5s".to_string()),
                    video_url: None,
                    image_url: None,
                    is_unilateral: true,
                    equipment: vec![],
                    rest_secs: 15,
                    metadata: None,
                },
                Stretch {
                    name: "Wrist extension".to_string(),
                    description: "Extend right arm forward, fingers up. Pull fingers back gently with left hand. Hold 15s, then switch arms.".to_string(),
                    duration_secs: 30,
                    difficulty_level: "Beginner".to_string(),
                    sets: 2,
                    reps: Some("Hold 15s".to_string()),
                    video_url: None,
                    image_url: None,
                    is_unilateral: true,
                    equipment: vec![],
                    rest_secs: 15,
                    metadata: None,
                }
            ],
            tracks: vec![
                PhysicalTrack {
                    id: "split_training_program".to_string(),
                    name: "Split Training Program".to_string(),
                    description: "A neuro-biomechanical approach combining neural dynamics, eccentric loading, PNF (Contract-Relax), and passive static elongation.".to_string(),
                    levels: vec![],
                    exercises: Some(vec![
                        CustomExercise {
                            name: "Sciatic Nerve Slider".to_string(),
                            description: "Reduces sciatic mechanosensitivity to rapidly improve apparent hamstring extensibility prior to mechanical stretching.".to_string(),
                            category: "Neural Dynamics".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Sciatic Nerve Pathway".to_string(), "Posterior Chain".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 45,
                            sets: 3,
                            reps: None,
                            reps_min: Some(10),
                            reps_max: Some(15),
                            video_url: Some("https://www.youtube.com/watch?v=XP1yzpFR6ho".to_string()),
                            image_url: Some("assets/stretches/sciatic-slider.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                        CustomExercise {
                            name: "Low Lunge with Posterior Pelvic Tilt".to_string(),
                            description: "Elongates the anterior structures required for the trailing leg in a front split. The posterior pelvic tilt is essential to prevent lumbar hyperlordosis.".to_string(),
                            category: "Static / Active Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Iliopsoas".to_string(), "Rectus Femoris (Hip Flexors)".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 60,
                            sets: 2,
                            reps: Some("30-60s hold per leg".to_string()),
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=aOfniMZY2hk".to_string()),
                            image_url: Some("assets/stretches/low-lunge.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                        CustomExercise {
                            name: "Half Split (Flat Back)".to_string(),
                            description: "Isolates the hamstring of the leading leg for the front split without requiring concurrent hip extension of the opposite leg.".to_string(),
                            category: "Static Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Hamstrings (Biceps Femoris, Semitendinosus, Semimembranosus)".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 60,
                            sets: 2,
                            reps: Some("30-60s hold per leg".to_string()),
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=1wXNELxZI4I".to_string()),
                            image_url: Some("assets/stretches/half-split.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                        CustomExercise {
                            name: "Cossack Squat".to_string(),
                            description: "Builds eccentric strength in the adductors and improves end-range hip mobility required to safely support the middle split.".to_string(),
                            category: "Eccentric / Dynamic Mobility".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Adductor Magnus".to_string(), "Adductor Longus".to_string(), "Gluteus Medius".to_string()],
                            difficulty: "Intermediate".to_string(),
                            duration_secs: 60,
                            sets: 3,
                            reps: None,
                            reps_min: Some(8),
                            reps_max: Some(10),
                            video_url: Some("https://www.youtube.com/watch?v=xXwdKm5uLAM".to_string()),
                            image_url: Some("assets/stretches/cossack-squat.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 30,
                        },
                        CustomExercise {
                            name: "Frog Stretch".to_string(),
                            description: "Prepares the pelvis for the anterior tilt necessary to clear the greater trochanter in a middle split, bypassing the medial knee stress associated with straight legs.".to_string(),
                            category: "Static / PNF Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Adductor Complex".to_string(), "Pectineus".to_string(), "Gracilis".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 90,
                            sets: 2,
                            reps: Some("60-120s hold".to_string()),
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=mO8S7qOdcdU".to_string()),
                            image_url: Some("assets/stretches/frog-stretch.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 30,
                        },
                        CustomExercise {
                            name: "Pancake Stretch".to_string(),
                            description: "Improves straddle fold mechanics. Note: This stretch uses a downward pelvic orientation, distinct from the true middle split.".to_string(),
                            category: "Static Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Hamstrings".to_string(), "Lower Back".to_string(), "Adductors".to_string()],
                            difficulty: "Intermediate".to_string(),
                            duration_secs: 60,
                            sets: 2,
                            reps: Some("60s hold".to_string()),
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=CHRUb43S6RM".to_string()),
                            image_url: Some("assets/stretches/pancake.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 30,
                        },
                        CustomExercise {
                            name: "Assisted Front Split (with Blocks/Pillows)".to_string(),
                            description: "Allows the nervous system to adapt to the full split position using viscoelastic stress relaxation without triggering the myotatic reflex.".to_string(),
                            category: "End-Range Static Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Full Anterior and Posterior Chains".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 60,
                            sets: 3,
                            reps: Some("30-60s hold per leg".to_string()),
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=B8BivbTW-_0".to_string()),
                            image_url: Some("assets/stretches/front-split-assisted.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 30,
                        },
                        CustomExercise {
                            name: "Wall Middle Split".to_string(),
                            description: "Utilizes gravity to safely accumulate time-under-tension in abducted hip ranges while supporting the spine and neutralizing the pelvic tilt requirement.".to_string(),
                            category: "Passive Static Stretch".to_string(),
                            target_muscles: vec![],
                            muscle_groups: vec!["Adductor Complex".to_string()],
                            difficulty: "Beginner".to_string(),
                            duration_secs: 90,
                            sets: 1,
                            reps: Some("2-3 min hold".to_string()),
                            reps_min: None,
                            reps_max: None,
                            video_url: Some("https://www.youtube.com/watch?v=Iy_zqS8notQ".to_string()),
                            image_url: Some("assets/stretches/wall-straddle.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 0,
                        },
                    ]),
                    metadata: None,
                }
            ],
            user_progress: UserProgress {
                active_track_id: Some("split_training_program".to_string()),
                current_level_number: Some(1),
                onboarding_tier: Some("beginner".to_string()),
                completed_sessions_count: 0,
                last_completed_at: None,
                level_started_at: None,
            },
        };
        config.populate_levels();
        config
    }
}

impl AppConfig {
    pub fn populate_levels(&mut self) {
        let onboarding_tier = self
            .user_progress
            .onboarding_tier
            .as_deref()
            .unwrap_or("beginner")
            .to_lowercase();

        let difficulty_priority = |diff: &str| -> u32 {
            match diff.to_lowercase().as_str() {
                "beginner" => 1,
                "intermediate" => 2,
                "advanced" => 3,
                _ => 1,
            }
        };

        let user_priority = difficulty_priority(&onboarding_tier);

        for track in &mut self.tracks {
            if let Some(ref exercises) = track.exercises {
                if !exercises.is_empty() {
                    let filtered: Vec<&CustomExercise> = exercises
                        .iter()
                        .filter(|ex| difficulty_priority(&ex.difficulty) <= user_priority)
                        .collect();

                    let mut levels = Vec::new();
                    for (index, ex) in filtered.iter().enumerate() {
                        let target_muscles = if !ex.target_muscles.is_empty() {
                            ex.target_muscles.clone()
                        } else {
                            ex.muscle_groups.clone()
                        };

                        let equipment_str = if !ex.equipment.is_empty() {
                            ex.equipment.join(", ")
                        } else {
                            "None".to_string()
                        };

                        let rest_str = if ex.rest_secs > 0 {
                            format!("{}s", ex.rest_secs)
                        } else {
                            "None".to_string()
                        };

                        let reps_str = if let Some(ref reps) = ex.reps {
                            reps.clone()
                        } else if let (Some(min), Some(max)) = (ex.reps_min, ex.reps_max) {
                            format!("{}-{} Reps", min, max)
                        } else if let Some(min) = ex.reps_min {
                            format!("{} Reps", min)
                        } else {
                            format!("{}s Hold", ex.duration_secs)
                        };

                        let description = format!(
                            "{}\n\n• Category: {}\n• Target: {}\n• Side: {}\n• Equipment: {}\n• Rest: {}\n• Instructions: {} ({} Sets)",
                            ex.description,
                            ex.category,
                            target_muscles.join(", "),
                            if ex.is_unilateral {
                                "Unilateral (Perform per side)"
                            } else {
                                "Bilateral"
                            },
                            equipment_str,
                            rest_str,
                            reps_str,
                            ex.sets
                        );

                        levels.push(Level {
                            level_number: (index + 1) as u64,
                            title: ex.name.clone(),
                            description,
                            target_duration_secs: ex.duration_secs,
                            video_url: ex.video_url.clone(),
                            image_url: ex.image_url.clone(),
                            is_unilateral: ex.is_unilateral,
                            equipment: ex.equipment.clone(),
                            rest_secs: ex.rest_secs,
                            reps: Some(reps_str),
                            sets: Some(ex.sets),
                        });
                    }
                    track.levels = levels;
                }
            }
        }
    }
}

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

#[derive(serde::Serialize)]
pub struct TimerStatePayload {
    pub micro_left: u64,
    pub active_left: u64,
    pub timer_paused: bool,
    pub current_break_state: Option<String>,
}

#[derive(serde::Serialize)]
pub struct SessionDataPayload {
    pub card: Option<ActiveRecallCard>,
    pub prompt: Option<String>,
    pub stretch: Option<Stretch>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

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

