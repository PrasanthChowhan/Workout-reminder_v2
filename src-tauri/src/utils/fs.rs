use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// Retrieves path to the config file in AppData
pub fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    // Create directory if it doesn't exist
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    Ok(path.join("config.json"))
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

pub fn find_prompts_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let mut current_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let mut prompts_dir = current_dir.join("docs").join("prompts");
    
    let mut found = false;
    for _ in 0..5 {
        if prompts_dir.exists() || current_dir.join(".git").exists() {
            prompts_dir = current_dir.join("docs").join("prompts");
            found = true;
            break;
        }
        if let Some(parent) = current_dir.parent() {
            current_dir = parent.to_path_buf();
            prompts_dir = current_dir.join("docs").join("prompts");
        } else {
            break;
        }
    }

    if !found {
        prompts_dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("prompts");
    }

    if !prompts_dir.exists() {
        fs::create_dir_all(&prompts_dir).map_err(|e| e.to_string())?;
    }

    Ok(prompts_dir)
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
