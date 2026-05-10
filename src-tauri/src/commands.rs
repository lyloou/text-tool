use serde::{Deserialize, Serialize};
use text_core::{
    ConvertMode, SearchMatch, comma_values_to_lines, convert_lines, deduplicate_lines,
    replace_all, replace_first, search_matches, sort_lines_ascending, sort_lines_descending,
    FindOptions,
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
    pub case_sensitive: bool,
    pub whole_word: bool,
    pub use_regex: bool,
    pub replace_all: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatchesRequest {
    pub output: String,
    pub query: String,
    pub case_sensitive: bool,
    pub whole_word: bool,
    pub use_regex: bool,
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
pub fn replace_text_command(request: ReplaceTextRequest) -> Result<ReplaceTextResponse, String> {
    let options = find_options(&request);
    let output = if request.replace_all {
        replace_all(&request.input, &request.find, &request.replace_with, options)?
    } else {
        replace_first(&request.input, &request.find, &request.replace_with, options)?
    };

    Ok(ReplaceTextResponse { output })
}

#[tauri::command]
pub fn search_matches_command(request: SearchMatchesRequest) -> Result<SearchMatchesResponse, String> {
    let matches = search_matches(
        &request.output,
        &request.query,
        FindOptions {
            case_sensitive: request.case_sensitive,
            whole_word: request.whole_word,
            use_regex: request.use_regex,
        },
    )?;
    Ok(SearchMatchesResponse { matches })
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

fn find_options(request: &ReplaceTextRequest) -> FindOptions {
    FindOptions {
        case_sensitive: request.case_sensitive,
        whole_word: request.whole_word,
        use_regex: request.use_regex,
    }
}
