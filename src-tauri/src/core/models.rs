use serde::{Deserialize, Serialize};
use serde_json::Value;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecallVariant {
    pub variant_id: String,
    pub concept_id: String,
    pub difficulty_level: String,
    pub scenario_prose: String,
    pub scenario_code_snippet: Option<String>,
    pub hint: String,
    pub target_answer_prose: String,
    pub target_answer_code: Option<String>,
    pub common_trap: String,
    pub explanation: String,
    // FSRS fields
    pub due_date: DateTime<Utc>,
    pub stability: f64,
    pub difficulty: f64,
    pub elapsed_days: u64,
    pub scheduled_days: u64,
    pub reps: u32,
    pub lapses: u32,
    pub state: u32,
    pub last_review: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecallConcept {
    pub concept_id: String,
    pub concept_title: String,
    pub tags: Vec<String>,
    pub source_title: Option<String>,
    pub source_url: Option<String>,
    pub variants: Vec<RecallVariant>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecallSessionCard {
    pub concept_id: String,
    pub concept_title: String,
    pub variant_id: String,
    pub tags: Vec<String>,
    pub difficulty_level: String,
    pub scenario_prose: String,
    pub scenario_code_snippet: Option<String>,
    pub hint: String,
    pub target_answer_prose: String,
    pub target_answer_code: Option<String>,
    pub common_trap: String,
    pub explanation: String,
    pub source_title: Option<String>,
    pub source_url: Option<String>,
    pub srs_due_date: DateTime<Utc>,
    pub srs_state: u32,
}

// JSON Import schema models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonMetadata {
    pub source_title: Option<String>,
    pub source_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonVariant {
    pub variant_id: String,
    pub difficulty: String,
    pub scenario_prose: String,
    pub scenario_code_snippet: Option<String>,
    pub hint: String,
    pub target_answer_prose: String,
    pub target_answer_code: Option<String>,
    pub common_trap: String,
    pub explanation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonConcept {
    pub concept_id: String,
    pub concept_title: String,
    pub tags: Vec<String>,
    pub variants: Vec<JsonVariant>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonImportSchema {
    pub metadata: Option<JsonMetadata>,
    pub concepts: Vec<JsonConcept>,
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
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    pub description: String,
    #[serde(default)]
    pub execution_notes: Option<String>,
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


#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", content = "until")]
pub enum ReminderState {
    Active,
    PausedManual,
    PausedUntil(DateTime<Utc>),
    PausedUntilRestart,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub micro_break_interval_mins: u64,
    pub active_break_interval_mins: u64,
    pub micro_break_duration_secs: u64,
    pub active_break_duration_secs: u64,
    pub run_at_start: bool,
    pub daily_prompt: String,
    pub daily_prompt_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub settings: Settings,
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
    pub reminder_state: ReminderState,
}

#[derive(Serialize)]
pub struct SessionDataPayload {
    pub card: Option<RecallSessionCard>,
    pub prompt: Option<String>,
    pub stretch: Option<Stretch>,
}

#[derive(Serialize)]
pub struct InitialBreakDataPayload {
    pub config: AppConfig,
    pub session_data: SessionDataPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatCounters {
    pub total_sessions: i64,
    pub total_notes_recalled: i64,
    pub current_streak: i64,
    pub longest_streak: i64,
    pub active_days_this_year: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeatmapDay {
    pub date: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FsrsBreakdown {
    pub again: i64,
    pub hard: i64,
    pub good: i64,
    pub easy: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentExercise {
    pub exercise_id: String,
    pub completed_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentCheckin {
    pub local_date: String,
    pub response: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatisticsPayload {
    pub counters: StatCounters,
    pub heatmap: Vec<HeatmapDay>,
    pub fsrs_breakdown: FsrsBreakdown,
    pub recent_exercises: Vec<RecentExercise>,
    pub recent_checkins: Vec<RecentCheckin>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyQuestionStatus {
    pub enabled: bool,
    pub answered_today: bool,
    pub question: String,
}

