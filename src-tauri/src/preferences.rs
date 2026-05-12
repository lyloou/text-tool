use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Preferences {
    pub editor: EditorPreferences,
    pub appearance: AppearancePreferences,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorPreferences {
    pub show_line_numbers: bool,
    pub soft_wrap: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearancePreferences {
    pub theme: String,
    pub language: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavePreferencesRequest {
    pub preferences: Preferences,
}

#[derive(Debug, Deserialize, Serialize)]
struct PreferencesFile {
    #[serde(default)]
    editor: EditorPreferencesFile,
    #[serde(default)]
    appearance: AppearancePreferencesFile,
}

#[derive(Debug, Deserialize, Serialize)]
struct EditorPreferencesFile {
    #[serde(default = "default_true")]
    show_line_numbers: bool,
    #[serde(default = "default_true")]
    soft_wrap: bool,
}

#[derive(Debug, Deserialize, Serialize)]
struct AppearancePreferencesFile {
    #[serde(default = "default_theme")]
    theme: String,
    #[serde(default = "default_language")]
    language: String,
}

impl Default for Preferences {
    fn default() -> Self {
        Self {
            editor: EditorPreferences {
                show_line_numbers: true,
                soft_wrap: true,
            },
            appearance: AppearancePreferences {
                theme: default_theme(),
                language: default_language(),
            },
        }
    }
}

impl Default for EditorPreferencesFile {
    fn default() -> Self {
        Self {
            show_line_numbers: true,
            soft_wrap: true,
        }
    }
}

impl Default for AppearancePreferencesFile {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            language: default_language(),
        }
    }
}

impl From<PreferencesFile> for Preferences {
    fn from(value: PreferencesFile) -> Self {
        Self {
            editor: EditorPreferences {
                show_line_numbers: value.editor.show_line_numbers,
                soft_wrap: value.editor.soft_wrap,
            },
            appearance: AppearancePreferences {
                theme: normalized_theme(value.appearance.theme),
                language: normalized_language(value.appearance.language),
            },
        }
    }
}

impl From<Preferences> for PreferencesFile {
    fn from(value: Preferences) -> Self {
        Self {
            editor: EditorPreferencesFile {
                show_line_numbers: value.editor.show_line_numbers,
                soft_wrap: value.editor.soft_wrap,
            },
            appearance: AppearancePreferencesFile {
                theme: normalized_theme(value.appearance.theme),
                language: normalized_language(value.appearance.language),
            },
        }
    }
}

#[tauri::command]
pub fn load_preferences_command(app: AppHandle) -> Preferences {
    let Ok(path) = preferences_path(&app) else {
        return Preferences::default();
    };

    let Ok(contents) = fs::read_to_string(path) else {
        return Preferences::default();
    };

    toml::from_str::<PreferencesFile>(&contents)
        .map(Preferences::from)
        .unwrap_or_default()
}

#[tauri::command]
pub fn save_preferences_command(app: AppHandle, request: SavePreferencesRequest) -> Result<Preferences, String> {
    let path = preferences_path(&app)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let preferences_file = PreferencesFile::from(request.preferences);
    let contents = toml::to_string_pretty(&preferences_file).map_err(|error| error.to_string())?;
    fs::write(path, contents).map_err(|error| error.to_string())?;

    Ok(Preferences::from(preferences_file))
}

fn preferences_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app.path().app_config_dir().map_err(|error| error.to_string())?;
    Ok(config_dir.join("config.toml"))
}

fn default_true() -> bool {
    true
}

fn default_theme() -> String {
    "light".to_string()
}

fn default_language() -> String {
    "zh".to_string()
}

fn normalized_theme(value: String) -> String {
    match value.as_str() {
        "dark" => value,
        _ => default_theme(),
    }
}

fn normalized_language(value: String) -> String {
    match value.as_str() {
        "en" => value,
        _ => default_language(),
    }
}
