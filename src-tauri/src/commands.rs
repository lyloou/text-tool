use serde::{Deserialize, Serialize};
use text_core::{
    ConvertMode, comma_values_to_lines, convert_lines, deduplicate_lines,
    sort_lines_ascending, sort_lines_descending,
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertLinesRequest {
    pub input: String,
    pub mode: String,
    pub ignore_empty_lines: bool,
    pub wrap_with_parentheses: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineOperationRequest {
    pub input: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SortLinesRequest {
    pub input: String,
    pub numeric_sort: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertLinesResponse {
    pub output: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LineOperationResponse {
    pub output: String,
}

#[tauri::command]
pub fn convert_lines_command(request: ConvertLinesRequest) -> Result<ConvertLinesResponse, String> {
    let mode = parse_mode(&request.mode)?;
    let output = convert_lines(
        &request.input,
        mode,
        request.ignore_empty_lines,
        request.wrap_with_parentheses,
    );
    Ok(ConvertLinesResponse { output })
}

#[tauri::command]
pub fn deduplicate_lines_command(request: LineOperationRequest) -> LineOperationResponse {
    let output = deduplicate_lines(&request.input);
    LineOperationResponse { output }
}

#[tauri::command]
pub fn sort_lines_ascending_command(request: SortLinesRequest) -> LineOperationResponse {
    let output = sort_lines_ascending(&request.input, request.numeric_sort);
    LineOperationResponse { output }
}

#[tauri::command]
pub fn sort_lines_descending_command(request: SortLinesRequest) -> LineOperationResponse {
    let output = sort_lines_descending(&request.input, request.numeric_sort);
    LineOperationResponse { output }
}

#[tauri::command]
pub fn comma_values_to_lines_command(request: LineOperationRequest) -> LineOperationResponse {
    let output = comma_values_to_lines(&request.input);
    LineOperationResponse { output }
}

fn parse_mode(value: &str) -> Result<ConvertMode, String> {
    match value {
        "double" => Ok(ConvertMode::DoubleQuoted),
        "single" => Ok(ConvertMode::SingleQuoted),
        "plain" => Ok(ConvertMode::Plain),
        _ => Err("Unsupported convert mode".to_string()),
    }
}
