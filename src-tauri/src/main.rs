mod commands;
mod preferences;

use commands::{
    comma_values_to_lines_command, convert_lines_command, deduplicate_lines_command,
    find_matches_command, replace_all_command, replace_first_command, sort_lines_ascending_command,
    sort_lines_descending_command,
};
use preferences::{load_preferences_command, save_preferences_command};
use tauri::{
    menu::{Menu, MenuItemBuilder, PredefinedMenuItem},
    Manager, WebviewUrl, WebviewWindowBuilder,
};

const OPEN_SETTINGS_MENU_ID: &str = "open_settings";
const SETTINGS_WINDOW_LABEL: &str = "settings";

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let handle = app.handle();
            let menu = Menu::default(handle)?;
            let settings_item = MenuItemBuilder::with_id(OPEN_SETTINGS_MENU_ID, "Settings...")
                .accelerator("CmdOrCtrl+,")
                .build(handle)?;

            if let Some(app_menu) = menu.items()?.first().and_then(|item| item.as_submenu()) {
                app_menu.insert_items(&[&settings_item, &PredefinedMenuItem::separator(handle)?], 1)?;
            }

            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            if event.id() == OPEN_SETTINGS_MENU_ID {
                let _ = open_settings_window(app);
            }
        })
        .invoke_handler(tauri::generate_handler![
            convert_lines_command,
            deduplicate_lines_command,
            sort_lines_ascending_command,
            sort_lines_descending_command,
            comma_values_to_lines_command,
            find_matches_command,
            replace_first_command,
            replace_all_command,
            load_preferences_command,
            save_preferences_command,
            close_settings_window_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn open_settings_window(app: &tauri::AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(SETTINGS_WINDOW_LABEL) {
        window.show()?;
        window.set_focus()?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        app,
        SETTINGS_WINDOW_LABEL,
        WebviewUrl::App("index.html?window=settings".into()),
    )
    .title("Preferences")
    .inner_size(520.0, 580.0)
    .min_inner_size(480.0, 520.0)
    .resizable(false)
    .center()
    .build()?;

    Ok(())
}

#[tauri::command]
fn close_settings_window_command(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(SETTINGS_WINDOW_LABEL) {
        window.close().map_err(|error| error.to_string())?;
    }

    Ok(())
}
