use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn get_config_path_internal(app_data_dir: &std::path::Path) -> Result<PathBuf, String> {
    // Create directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(app_data_dir).map_err(|e| e.to_string())?;
    }
    Ok(app_data_dir.join("config.json"))
}

// Retrieves path to the config file in AppData
pub fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    get_config_path_internal(&path)
}

pub fn find_issues_dir_internal(start_dir: &std::path::Path, app_data_dir: &std::path::Path) -> Result<PathBuf, String> {
    let mut current_dir = start_dir.to_path_buf();
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
        issues_dir = app_data_dir.join("issues");
    }

    if !issues_dir.exists() {
        fs::create_dir_all(&issues_dir).map_err(|e| e.to_string())?;
    }

    Ok(issues_dir)
}


// Search for the project issues folder or fallback to AppData
pub fn find_issues_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let start_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    find_issues_dir_internal(&start_dir, &app_data_dir)
}

#[cfg(debug_assertions)]
pub fn find_prompts_dir_internal_dev(start_dir: &std::path::Path) -> Option<PathBuf> {
    let mut current_dir = start_dir.to_path_buf();
    let mut prompts_dir = current_dir.join("docs").join("prompts");

    for _ in 0..5 {
        if prompts_dir.exists() || current_dir.join(".git").exists() {
            prompts_dir = current_dir.join("docs").join("prompts");
            return Some(prompts_dir);
        }
        if let Some(parent) = current_dir.parent() {
            current_dir = parent.to_path_buf();
            prompts_dir = current_dir.join("docs").join("prompts");
        } else {
            break;
        }
    }
    None
}

pub fn find_prompts_dir(app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        let start_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
        if let Some(p) = find_prompts_dir_internal_dev(&start_dir) {
            return Ok(p);
        }
    }

    // In production (or if not found in dev), resolve from the bundled resources
    app.path()
        .resolve("docs/prompts", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve resource path: {}", e))
}

pub fn set_run_at_start(app: &AppHandle, enabled: bool) -> Result<(), String> {
    let _ = app;
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

        #[cfg(debug_assertions)]
        let registry_key = "WorkoutReminderDev";
        #[cfg(not(debug_assertions))]
        let registry_key = "WorkoutReminder";

        if enabled {
            let formatted_path = format!("\"{}\"", path_str);
            match Command::new("reg")
                .args([
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    registry_key,
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
                .args([
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    registry_key,
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

        #[cfg(debug_assertions)]
        let plist_name = "com.workoutreminder.app.dev";
        #[cfg(not(debug_assertions))]
        let plist_name = "com.workoutreminder.app";

        let plist_dir = home.join("Library").join("LaunchAgents");
        let plist_path = plist_dir.join(format!("{}.plist", plist_name));

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
    <string>{}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>"#,
                plist_name,
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

        #[cfg(debug_assertions)]
        let (app_name, desktop_filename) = ("Workout Reminder Dev", "workout-reminder-dev.desktop");
        #[cfg(not(debug_assertions))]
        let (app_name, desktop_filename) = ("Workout Reminder", "workout-reminder.desktop");

        let autostart_dir = config_dir.join("autostart");
        let desktop_path = autostart_dir.join(desktop_filename);

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
Name={}
Exec={}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Workout & Break Reminder
"#,
                app_name,
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

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_get_config_path_internal() {
        let dir = tempdir().unwrap();
        let app_data_dir = dir.path().join("app_data");

        // Test directory doesn't exist yet
        assert!(!app_data_dir.exists());

        let config_path = get_config_path_internal(&app_data_dir).unwrap();

        // Directory should now exist
        assert!(app_data_dir.exists());
        // Path should have config.json appended
        assert_eq!(config_path, app_data_dir.join("config.json"));
    }

    #[test]
    fn test_find_issues_dir_internal_finds_issues_folder() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let app_data_dir = root.join("app_data");

        // Create an 'issues' directory directly in the start dir
        let start_dir = root.join("project");
        fs::create_dir_all(&start_dir).unwrap();
        let expected_issues_dir = start_dir.join("issues");
        fs::create_dir_all(&expected_issues_dir).unwrap();

        let issues_dir = find_issues_dir_internal(&start_dir, &app_data_dir).unwrap();

        assert_eq!(issues_dir, expected_issues_dir);
    }

    #[test]
    fn test_find_issues_dir_internal_finds_git_folder() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let app_data_dir = root.join("app_data");

        // Create a '.git' directory in root
        let git_dir = root.join(".git");
        fs::create_dir_all(&git_dir).unwrap();

        // start_dir is deeply nested
        let start_dir = root.join("a").join("b").join("c");
        fs::create_dir_all(&start_dir).unwrap();

        let expected_issues_dir = root.join("issues");

        let issues_dir = find_issues_dir_internal(&start_dir, &app_data_dir).unwrap();

        // Should traverse up, find .git, and return root/issues
        assert_eq!(issues_dir, expected_issues_dir);
        // It should have created the issues directory
        assert!(expected_issues_dir.exists());
    }

    #[test]
    fn test_find_issues_dir_internal_fallback_to_app_data() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        // Start dir with no issues or .git in hierarchy
        let start_dir = root.join("a").join("b").join("c");
        fs::create_dir_all(&start_dir).unwrap();

        let app_data_dir = root.join("app_data");
        let expected_issues_dir = app_data_dir.join("issues");

        let issues_dir = find_issues_dir_internal(&start_dir, &app_data_dir).unwrap();

        assert_eq!(issues_dir, expected_issues_dir);
        assert!(expected_issues_dir.exists());
    }

    #[cfg(debug_assertions)]
    #[test]
    fn test_find_prompts_dir_internal_dev_finds_prompts() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        // Create docs/prompts
        let prompts_dir = root.join("docs").join("prompts");
        fs::create_dir_all(&prompts_dir).unwrap();

        let start_dir = root.join("src");
        fs::create_dir_all(&start_dir).unwrap();

        let found = find_prompts_dir_internal_dev(&start_dir);

        assert_eq!(found, Some(prompts_dir));
    }

    #[cfg(debug_assertions)]
    #[test]
    fn test_find_prompts_dir_internal_dev_finds_git() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        // Create .git
        fs::create_dir_all(root.join(".git")).unwrap();

        let start_dir = root.join("src").join("utils");
        fs::create_dir_all(&start_dir).unwrap();

        let expected = root.join("docs").join("prompts");

        let found = find_prompts_dir_internal_dev(&start_dir);

        assert_eq!(found, Some(expected));
    }

    #[cfg(debug_assertions)]
    #[test]
    fn test_find_prompts_dir_internal_dev_not_found() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let start_dir = root.join("a").join("b").join("c");
        fs::create_dir_all(&start_dir).unwrap();

        let found = find_prompts_dir_internal_dev(&start_dir);

        assert_eq!(found, None);
    }
}
