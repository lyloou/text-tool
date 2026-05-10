use serde::{Deserialize, Serialize};
use text_core::{
    ConvertMode, SearchMatch, comma_values_to_lines, convert_lines, deduplicate_lines,
    replace_text, search_matches, sort_lines_ascending,
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertLinesRequest {
    pub input: String,
    pub mode: String,
    pub ignore_empty_lines: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceTextRequest {
    pub input: String,
    pub find: String,
    pub replace_with: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatchesRequest {
    pub output: String,
    pub query: String,
    pub case_sensitive: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LineOperationRequest {
    pub input: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertLinesResponse {
    pub output: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceTextResponse {
    pub output: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatchesResponse {
    pub matches: Vec<SearchMatch>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LineOperationResponse {
    pub output: String,
}

#[tauri::command]
pub fn convert_lines_command(request: ConvertLinesRequest) -> Result<ConvertLinesResponse, String> {
    let mode = parse_mode(&request.mode)?;
    let output = convert_lines(&request.input, mode, request.ignore_empty_lines);
    Ok(ConvertLinesResponse { output })
}

#[tauri::command]
pub fn replace_text_command(request: ReplaceTextRequest) -> ReplaceTextResponse {
    let output = replace_text(&request.input, &request.find, &request.replace_with);
    ReplaceTextResponse { output }
}

#[tauri::command]
pub fn search_matches_command(request: SearchMatchesRequest) -> SearchMatchesResponse {
    let matches = search_matches(&request.output, &request.query, request.case_sensitive);
    SearchMatchesResponse { matches }
}

#[tauri::command]
pub fn deduplicate_lines_command(request: LineOperationRequest) -> LineOperationResponse {
    let output = deduplicate_lines(&request.input);
    LineOperationResponse { output }
}

#[tauri::command]
pub fn sort_lines_ascending_command(request: LineOperationRequest) -> LineOperationResponse {
    let output = sort_lines_ascending(&request.input);
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
