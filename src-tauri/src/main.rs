mod commands;
mod preferences;

use commands::{
    comma_values_to_lines_command, convert_lines_command, deduplicate_lines_command,
    replace_text_command, search_matches_command, sort_lines_ascending_command,
    sort_lines_descending_command,
};
use preferences::{load_preferences_command, save_preferences_command};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            convert_lines_command,
            replace_text_command,
            search_matches_command,
            deduplicate_lines_command,
            sort_lines_ascending_command,
            sort_lines_descending_command,
            comma_values_to_lines_command,
            load_preferences_command,
            save_preferences_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
