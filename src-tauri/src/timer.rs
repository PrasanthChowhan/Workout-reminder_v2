use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveRecallCard {
    pub id: String,
    pub question: String,
    pub answer: String,
    pub category: String,
    pub source: Option<String>,
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
    pub asset_url: Option<String>, // Keep for backward compatibility
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
pub struct AppConfig {
    pub settings: Settings,
    pub active_recall_cards: Vec<ActiveRecallCard>,
    pub reflection_prompts: Vec<String>,
    pub stretches: Vec<Stretch>,
    pub tracks: Vec<PhysicalTrack>,
    pub user_progress: UserProgress,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub micro_break_interval_mins: u64,
    pub active_break_interval_mins: u64,
    pub micro_break_duration_secs: u64,
    pub active_break_duration_secs: u64,
    pub run_at_start: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
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
                },
                ActiveRecallCard {
                    id: "2".to_string(),
                    question: "String vs &str: What is the difference in Rust?".to_string(),
                    answer: "String is an owned, growable UTF-8 buffer on the heap. &str is an immutable borrow/view of a UTF-8 string that points to stack, heap, or static memory.".to_string(),
                    category: "Rust".to_string(),
                    source: None,
                },
                ActiveRecallCard {
                    id: "3".to_string(),
                    question: "What is the CAP Theorem?".to_string(),
                    answer: "A distributed system can guarantee at most two of: Consistency (every read gets recent data), Availability (every request gets a non-error response), and Partition Tolerance (system functions despite networking splits).".to_string(),
                    category: "System Design".to_string(),
                    source: None,
                },
                ActiveRecallCard {
                    id: "4".to_string(),
                    question: "What does deep module design mean?".to_string(),
                    answer: "A deep module has a simple interface (few methods) but hides a large amount of complex implementation/behavior behind it, maximizing code leverage.".to_string(),
                    category: "Software Design".to_string(),
                    source: None,
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
                }
            ],
            tracks: vec![
                PhysicalTrack {
                    id: "side_splits".to_string(),
                    name: "Side Splits".to_string(),
                    description: "Progressive stretching track to achieve a full side (middle) split.".to_string(),
                    levels: vec![
                        Level {
                            level_number: 1,
                            title: "Wall Straddle".to_string(),
                            description: "Lie flat on your back with your glutes pressed against the wall, legs pointing straight up. Slowly allow your legs to slide open sideways into a wide 'V' shape, letting gravity pull them down. Keep knees fully locked and toes flexed back toward shins. Relax upper body, keep lower back flat on the floor, and breathe deeply.".to_string(),
                            target_duration_secs: 60,
                            asset_url: Some("assets/stretches/wall-straddle.png".to_string()),
                            video_url: None,
                            image_url: Some("assets/stretches/wall-straddle.png".to_string()),
                            is_unilateral: false,
                            equipment: vec!["wall".to_string()],
                            rest_secs: 15,
                        },
                        Level {
                            level_number: 2,
                            title: "Half Split".to_string(),
                            description: "Start on all fours. Extend your right leg straight out to the side, keeping the inner edge of your foot flat on the floor. Keep your left knee directly under your left hip at a 90-degree angle. Lower hands or forearms to the floor. Keeping your back flat, gently rock your hips backward toward your left heel, then forward. Hold the end range. Repeat on the left side.".to_string(),
                            target_duration_secs: 60,
                            asset_url: Some("assets/stretches/half-split.png".to_string()),
                            video_url: None,
                            image_url: Some("assets/stretches/half-split.png".to_string()),
                            is_unilateral: true,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                        Level {
                            level_number: 3,
                            title: "Frog Stretch".to_string(),
                            description: "Begin on hands and knees. Slide your knees out to the sides as wide as comfortable. Bend your knees at a 90-degree angle and flex your feet so your inner shins and ankles rest on the floor (toes pointing outward). Lower down to your forearms. Keep your spine neutral and core lightly engaged. Slowly press your hips back toward your heels until you feel a deep stretch in the groin.".to_string(),
                            target_duration_secs: 45,
                            asset_url: Some("assets/stretches/frog-stretch.png".to_string()),
                            video_url: None,
                            image_url: Some("assets/stretches/frog-stretch.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                        Level {
                            level_number: 4,
                            title: "Side Split".to_string(),
                            description: "From a standing wide-legged stance, place your hands on the floor for support. Slowly slide your feet out to the sides, keeping your legs straight and kneecaps pointing up or forward. Lower down onto your hands, blocks, or forearms. Keep hips aligned vertically with heels. Flex your quadriceps and glutes to active-stabilize the joints.".to_string(),
                            target_duration_secs: 45,
                            asset_url: Some("assets/stretches/side-split.png".to_string()),
                            video_url: None,
                            image_url: Some("assets/stretches/side-split.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 15,
                        },
                    ],
                    exercises: None,
                },
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
                            reps: Some("10-15 slow, dynamic repetitions per leg".to_string()),
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
                            reps: Some("8-10 reps per side".to_string()),
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
                            video_url: Some("https://www.youtube.com/watch?v=Iy_zqS8notQ".to_string()),
                            image_url: Some("assets/stretches/wall-straddle.png".to_string()),
                            is_unilateral: false,
                            equipment: vec![],
                            rest_secs: 0,
                        },
                    ]),
                }
            ],
            user_progress: UserProgress {
                active_track_id: None,
                current_level_number: None,
                onboarding_tier: None,
                completed_sessions_count: 0,
                last_completed_at: None,
                level_started_at: None,
            },
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
}

// Retrieves path to the config file in AppData
pub fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    // Create directory if it doesn't exist
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    path.push("config.json");
    Ok(path)
}

// Loads config from file, or returns default if not found
pub fn load_config(app: &AppHandle) -> AppConfig {
    if let Ok(path) = get_config_path(app) {
        if path.exists() {
            if let Ok(data) = fs::read_to_string(path) {
                if let Ok(mut config) = serde_json::from_str::<AppConfig>(&data) {
                    // Update default tracks to ensure they have the latest exercises/video URLs
                    let default_config = AppConfig::default();
                    for default_track in default_config.tracks {
                        if let Some(existing_track) = config.tracks.iter_mut().find(|t| t.id == default_track.id) {
                            existing_track.exercises = default_track.exercises;
                            existing_track.levels = default_track.levels;
                            existing_track.name = default_track.name;
                            existing_track.description = default_track.description;
                        } else {
                            config.tracks.push(default_track);
                        }
                    }
                    return config;
                }
            }
        }
    }
    AppConfig::default()
}

// Saves config to file
pub fn save_config_file(app: &AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = get_config_path(app)?;
    let serialized = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, serialized).map_err(|e| e.to_string())?;
    
    // Configure run at start
    let _ = set_run_at_start(app, config.settings.run_at_start);
    
    Ok(())
}

#[allow(unused_variables)]
pub fn set_run_at_start(app: &AppHandle, enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::env;
        use std::process::Command;

        let current_exe = match env::current_exe() {
            Ok(exe) => exe,
            Err(e) => {
                eprintln!("Failed to get current executable path for autostart: {}", e);
                return Ok(());
            }
        };
        
        let path_str = current_exe.to_string_lossy().into_owned();

        if enabled {
            let formatted_path = format!("\"{}\"", path_str);
            match Command::new("reg")
                .args(&[
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "WorkoutReminder",
                    "/t",
                    "REG_SZ",
                    "/d",
                    &formatted_path,
                    "/f",
                ])
                .status()
            {
                Ok(status) => {
                    if !status.success() {
                        eprintln!("reg command failed to add startup entry");
                    }
                }
                Err(e) => {
                    eprintln!("Failed to execute reg command to add startup entry: {}", e);
                }
            }
        } else {
            // Run reg delete; ignore error if entry already did not exist
            let _ = Command::new("reg")
                .args(&[
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "WorkoutReminder",
                    "/f",
                ])
                .status();
        }
    }

    #[cfg(target_os = "macos")]
    {
        use std::env;
        use std::fs as std_fs;

        let current_exe = match env::current_exe() {
            Ok(exe) => exe,
            Err(e) => {
                eprintln!("Failed to get current executable path for autostart: {}", e);
                return Ok(());
            }
        };
        
        let path_str = current_exe.to_string_lossy().into_owned();
        
        let home = match app.path().home_dir() {
            Ok(dir) => dir,
            Err(e) => {
                eprintln!("Failed to get home directory for macOS autostart: {}", e);
                return Ok(());
            }
        };
        let plist_dir = home.join("Library").join("LaunchAgents");
        let plist_path = plist_dir.join("com.workoutreminder.app.plist");

        if enabled {
            if !plist_dir.exists() {
                if let Err(e) = std_fs::create_dir_all(&plist_dir) {
                    eprintln!("Failed to create LaunchAgents directory: {}", e);
                    return Ok(());
                }
            }
            
            let plist_content = format!(
                r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.workoutreminder.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>{}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>"#,
                path_str
            );
            
            if let Err(e) = std_fs::write(plist_path, plist_content) {
                eprintln!("Failed to write LaunchAgent plist: {}", e);
            }
        } else {
            if plist_path.exists() {
                let _ = std_fs::remove_file(plist_path);
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        use std::env;
        use std::fs as std_fs;

        let current_exe = match env::current_exe() {
            Ok(exe) => exe,
            Err(e) => {
                eprintln!("Failed to get current executable path for autostart: {}", e);
                return Ok(());
            }
        };
        
        let path_str = current_exe.to_string_lossy().into_owned();
        
        let config_dir = match app.path().config_dir() {
            Ok(dir) => dir,
            Err(e) => {
                eprintln!("Failed to get config directory for Linux autostart: {}", e);
                return Ok(());
            }
        };
        let autostart_dir = config_dir.join("autostart");
        let desktop_path = autostart_dir.join("workout-reminder.desktop");

        if enabled {
            if !autostart_dir.exists() {
                if let Err(e) = std_fs::create_dir_all(&autostart_dir) {
                    eprintln!("Failed to create autostart directory: {}", e);
                    return Ok(());
                }
            }
            
            let desktop_content = format!(
                r#"[Desktop Entry]
Type=Application
Name=Workout Reminder
Exec={}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Workout & Break Reminder
"#,
                path_str
            );
            
            if let Err(e) = std_fs::write(desktop_path, desktop_content) {
                eprintln!("Failed to write desktop autostart launcher: {}", e);
            }
        } else {
            if desktop_path.exists() {
                let _ = std_fs::remove_file(desktop_path);
            }
        }
    }

    Ok(())
}
