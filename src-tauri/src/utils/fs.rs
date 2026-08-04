use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::core::models::AppConfig;

// Retrieves path to the config file in AppData
pub fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    // Create directory if it doesn't exist
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    Ok(path.join("config.json"))
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
                            // Only overwrite levels if the default track doesn't use the exercises schema.
                            // For tracks with exercises (new schema), levels are dynamically generated.
                            let has_no_exercises = default_track.exercises.is_none();
                            existing_track.exercises = default_track.exercises;
                            if has_no_exercises {
                                existing_track.levels = default_track.levels;
                            }
                            existing_track.name = default_track.name;
                            existing_track.description = default_track.description;
                        } else {
                            config.tracks.push(default_track);
                        }
                    }

                    // Initialize default track if none is selected
                    if config.user_progress.active_track_id.is_none() {
                        config.user_progress.active_track_id = Some("split_training_program".to_string());
                        config.user_progress.current_level_number = Some(1);
                        config.user_progress.onboarding_tier = Some("beginner".to_string());
                    }

                    config.populate_levels();

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

// Search for the project issues folder or fallback to AppData
pub fn find_issues_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let mut current_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let mut issues_dir = current_dir.join("issues");
    
    // traverse up to find 'issues' or the root '.git'
    let mut found = false;
    for _ in 0..5 {
        if issues_dir.exists() || current_dir.join(".git").exists() {
            issues_dir = current_dir.join("issues");
            found = true;
            break;
        }
        if let Some(parent) = current_dir.parent() {
            current_dir = parent.to_path_buf();
            issues_dir = current_dir.join("issues");
        } else {
            break;
        }
    }

    if !found {
        issues_dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("issues");
    }

    if !issues_dir.exists() {
        fs::create_dir_all(&issues_dir).map_err(|e| e.to_string())?;
    }

    Ok(issues_dir)
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
