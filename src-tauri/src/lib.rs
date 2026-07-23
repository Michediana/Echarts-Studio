use std::fs;
use std::io::Write;
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
    {
        // Flush and fsync the temp file *before* renaming, so an abrupt crash
        // can never leave the rename ahead of the data hitting disk.
        let mut file = fs::File::create(&tmp_path)
            .map_err(|e| format!("Failed to create temp file: {e}"))?;
        file.write_all(content.as_bytes())
            .map_err(|e| format!("Failed to write temp file: {e}"))?;
        file.sync_all()
            .map_err(|e| format!("Failed to sync temp file: {e}"))?;
    }
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
fn export_image(path: String, data: String, dpi: Option<u32>) -> Result<(), String> {
    let path_obj = PathBuf::from(&path);
    if let Some(parent) = path_obj.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {e}"))?;
    }
    let is_png = data.starts_with("data:image/png;base64,");
    let stripped = data
        .strip_prefix("data:image/png;base64,")
        .or_else(|| data.strip_prefix("data:image/svg+xml;base64,"))
        .or_else(|| data.strip_prefix("data:image/jpeg;base64,"))
        .unwrap_or(&data);
    let mut bytes = general_purpose::STANDARD
        .decode(stripped)
        .map_err(|e| format!("Failed to decode base64 data: {e}"))?;

    // Embed the DPI as a PNG pHYs chunk so the resolution is carried as
    // physical-size metadata (print size) without changing the pixel count.
    if is_png {
        if let Some(dpi) = dpi {
            if dpi > 0 {
                set_png_dpi(&mut bytes, dpi);
            }
        }
    }

    fs::write(&path_obj, &bytes).map_err(|e| format!("Failed to write image file: {e}"))?;
    Ok(())
}

/// Insert (or replace) a pHYs chunk encoding the given DPI into a PNG byte
/// stream. Does nothing if the data is not a well-formed PNG.
fn set_png_dpi(bytes: &mut Vec<u8>, dpi: u32) {
    const SIGNATURE: [u8; 8] = [0x89, b'P', b'N', b'G', 0x0D, 0x0A, 0x1A, 0x0A];
    // Signature (8) + IHDR length (4) + "IHDR" (4) + IHDR data (13) + CRC (4).
    const IHDR_END: usize = 8 + 4 + 4 + 13 + 4;

    if bytes.len() < IHDR_END || bytes[..8] != SIGNATURE || &bytes[12..16] != b"IHDR" {
        return;
    }

    // If a pHYs chunk already immediately follows IHDR, drop it before inserting.
    if bytes.len() >= IHDR_END + 8 && &bytes[IHDR_END + 4..IHDR_END + 8] == b"pHYs" {
        let existing_len = u32::from_be_bytes([
            bytes[IHDR_END],
            bytes[IHDR_END + 1],
            bytes[IHDR_END + 2],
            bytes[IHDR_END + 3],
        ]) as usize;
        let total = 12 + existing_len; // length + type + data + crc
        bytes.drain(IHDR_END..IHDR_END + total);
    }

    // Pixels per metre = dpi / 0.0254 (metres per inch), rounded.
    let ppu = ((dpi as f64) / 0.0254).round() as u32;

    let mut chunk = Vec::with_capacity(21);
    chunk.extend_from_slice(&9u32.to_be_bytes()); // data length
    chunk.extend_from_slice(b"pHYs");
    chunk.extend_from_slice(&ppu.to_be_bytes()); // x pixels per unit
    chunk.extend_from_slice(&ppu.to_be_bytes()); // y pixels per unit
    chunk.push(1); // unit specifier: 1 = metre
    let crc = png_crc32(&chunk[4..]); // CRC over type + data
    chunk.extend_from_slice(&crc.to_be_bytes());

    let tail = bytes.split_off(IHDR_END);
    bytes.extend_from_slice(&chunk);
    bytes.extend_from_slice(&tail);
}

/// Standard PNG CRC-32 (ISO-HDLC) over the given bytes.
fn png_crc32(data: &[u8]) -> u32 {
    let mut crc: u32 = 0xFFFF_FFFF;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB8_8320;
            } else {
                crc >>= 1;
            }
        }
    }
    crc ^ 0xFFFF_FFFF
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
