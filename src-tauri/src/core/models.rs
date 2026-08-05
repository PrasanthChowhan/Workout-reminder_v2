use serde::{Deserialize, Serialize};
use serde_json::Value;

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
    #[serde(default)]
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

#[derive(Serialize)]
pub struct TimerStatePayload {
    pub micro_left: u64,
    pub active_left: u64,
    pub timer_paused: bool,
    pub current_break_state: Option<String>,
}

#[derive(Serialize)]
pub struct SessionDataPayload {
    pub card: Option<ActiveRecallCard>,
    pub prompt: Option<String>,
    pub stretch: Option<Stretch>,
}
