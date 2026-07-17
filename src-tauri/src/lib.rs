use std::fs;
use std::path::PathBuf;

use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize, Default)]
struct RecentProjects {
    projects: Vec<String>,
}

fn get_recent_projects_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create app data dir: {e}"))?;
    Ok(data_dir.join("recent_projects.json"))
}

#[tauri::command]
fn get_app_data_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create app data dir: {e}"))?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn read_project(path: String) -> Result<String, String> {
    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read project file: {e}"))?;
    Ok(content)
}

#[tauri::command]
fn write_project(path: String, content: String) -> Result<(), String> {
    let path_obj = PathBuf::from(&path);
    if let Some(parent) = path_obj.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {e}"))?;
    }
    let tmp_path = path_obj.with_extension("json.tmp");
    fs::write(&tmp_path, &content)
        .map_err(|e| format!("Failed to write temp file: {e}"))?;
    fs::rename(&tmp_path, &path_obj)
        .map_err(|e| format!("Failed to rename temp file: {e}"))?;
    Ok(())
}

#[tauri::command]
fn list_recent_projects(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let path = get_recent_projects_path(&app_handle)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read recent projects: {e}"))?;
    let data: RecentProjects =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse recent projects: {e}"))?;
    Ok(data.projects)
}

#[tauri::command]
fn add_recent_project(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    let config_path = get_recent_projects_path(&app_handle)?;
    let mut data: RecentProjects = if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read recent projects: {e}"))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse recent projects: {e}"))?
    } else {
        RecentProjects::default()
    };
    data.projects.retain(|p| p != &path);
    data.projects.insert(0, path);
    data.projects.truncate(20);
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize recent projects: {e}"))?;
    fs::write(&config_path, &json)
        .map_err(|e| format!("Failed to write recent projects: {e}"))?;
    Ok(())
}

#[tauri::command]
fn save_recent_projects(app_handle: tauri::AppHandle, projects: Vec<String>) -> Result<(), String> {
    let config_path = get_recent_projects_path(&app_handle)?;
    let data = RecentProjects { projects };
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize recent projects: {e}"))?;
    fs::write(&config_path, &json)
        .map_err(|e| format!("Failed to write recent projects: {e}"))?;
    Ok(())
}

#[tauri::command]
fn export_image(path: String, data: String) -> Result<(), String> {
    let path_obj = PathBuf::from(&path);
    if let Some(parent) = path_obj.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {e}"))?;
    }
    let stripped = data
        .strip_prefix("data:image/png;base64,")
        .or_else(|| data.strip_prefix("data:image/svg+xml;base64,"))
        .or_else(|| data.strip_prefix("data:image/jpeg;base64,"))
        .unwrap_or(&data);
    let bytes = general_purpose::STANDARD
        .decode(stripped)
        .map_err(|e| format!("Failed to decode base64 data: {e}"))?;
    fs::write(&path_obj, &bytes).map_err(|e| format!("Failed to write image file: {e}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_project,
            write_project,
            list_recent_projects,
            add_recent_project,
            get_app_data_dir,
            save_recent_projects,
            export_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
