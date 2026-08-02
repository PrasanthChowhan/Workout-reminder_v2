use crate::utils::fs::find_issues_dir;

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
