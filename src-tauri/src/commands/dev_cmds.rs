use crate::utils::fs::{find_issues_dir, find_prompts_dir};

#[tauri::command]
pub async fn create_dev_issue(app: tauri::AppHandle, text: String) -> Result<(), String> {
    let issues_dir = find_issues_dir(&app)?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let file_path = issues_dir.join(format!("issue-{}.md", timestamp));
    std::fs::write(&file_path, text).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn read_prompt_file(app: tauri::AppHandle, name: String) -> Result<String, String> {
    let input_path = std::path::Path::new(&name);

    // Prevent absolute paths
    if input_path.is_absolute() || name.starts_with('/') || name.starts_with('\\') {
        return Err("Absolute paths are not allowed".to_string());
    }

    // Prevent directory traversal components
    for component in input_path.components() {
        match component {
            std::path::Component::ParentDir => return Err("Directory traversal is not allowed".to_string()),
            std::path::Component::RootDir => return Err("Absolute paths are not allowed".to_string()),
            _ => {}
        }
    }

    let prompts_dir = find_prompts_dir(&app)?;
    let file_path = prompts_dir.join(&name);

    if !file_path.exists() {
        return Err(format!("Prompt file '{}' does not exist in prompts directory", name));
    }

    std::fs::read_to_string(&file_path).map_err(|e| e.to_string())
}
