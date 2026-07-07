use serde::{Deserialize, Serialize};
use text_core::{
    comma_values_to_lines, convert_all_formats, convert_lines, deduplicate_lines, replace_all,
    replace_first, search_matches, sort_lines_ascending, sort_lines_descending, ConvertMode,
    FindOptions, SearchMatch,
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
pub struct ConvertAllFormatsRequest {
    pub input: String,
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FindOptionsRequest {
    pub case_sensitive: bool,
    pub whole_word: bool,
    pub use_regex: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FindMatchesRequest {
    pub input: String,
    pub query: String,
    pub options: FindOptionsRequest,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceRequest {
    pub input: String,
    pub find: String,
    pub replace_with: String,
    pub options: FindOptionsRequest,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertLinesResponse {
    pub output: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertAllFormatsResponse {
    pub outputs: Vec<ConvertFormatResponse>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertFormatResponse {
    pub format: String,
    pub output: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LineOperationResponse {
    pub output: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FindMatchesResponse {
    pub matches: Vec<SearchMatch>,
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
pub fn convert_all_formats_command(request: ConvertAllFormatsRequest) -> ConvertAllFormatsResponse {
    let outputs = convert_all_formats(
        &request.input,
        request.ignore_empty_lines,
        request.wrap_with_parentheses,
    )
    .into_iter()
    .map(|converted| ConvertFormatResponse {
        format: format_key(converted.mode).to_string(),
        output: converted.output,
    })
    .collect();

    ConvertAllFormatsResponse { outputs }
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

#[tauri::command]
pub fn find_matches_command(request: FindMatchesRequest) -> FindMatchesResponse {
    let matches = search_matches_with_fallback(&request.input, &request.query, request.options.into());
    FindMatchesResponse { matches }
}

#[tauri::command]
pub fn replace_first_command(request: ReplaceRequest) -> LineOperationResponse {
    let output = replace_first_with_fallback(
        &request.input,
        &request.find,
        &request.replace_with,
        request.options.into(),
    );
    LineOperationResponse { output }
}

#[tauri::command]
pub fn replace_all_command(request: ReplaceRequest) -> LineOperationResponse {
    let output = replace_all_with_fallback(
        &request.input,
        &request.find,
        &request.replace_with,
        request.options.into(),
    );
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

fn format_key(mode: ConvertMode) -> &'static str {
    match mode {
        ConvertMode::DoubleQuoted => "double",
        ConvertMode::SingleQuoted => "single",
        ConvertMode::Plain => "plain",
    }
}

impl From<FindOptionsRequest> for FindOptions {
    fn from(value: FindOptionsRequest) -> Self {
        Self {
            case_sensitive: value.case_sensitive,
            whole_word: value.whole_word,
            use_regex: value.use_regex,
        }
    }
}

fn search_matches_with_fallback(input: &str, query: &str, options: FindOptions) -> Vec<SearchMatch> {
    search_matches(input, query, options)
        .or_else(|_| search_matches(input, query, literal_options(options)))
        .map(|matches| byte_matches_to_utf16_matches(input, matches))
        .unwrap_or_default()
}

fn replace_first_with_fallback(input: &str, find: &str, replace_with: &str, options: FindOptions) -> String {
    replace_first(input, find, replace_with, options)
        .or_else(|_| replace_first(input, find, replace_with, literal_options(options)))
        .unwrap_or_else(|_| input.to_string())
}

fn replace_all_with_fallback(input: &str, find: &str, replace_with: &str, options: FindOptions) -> String {
    replace_all(input, find, replace_with, options)
        .or_else(|_| replace_all(input, find, replace_with, literal_options(options)))
        .unwrap_or_else(|_| input.to_string())
}

fn literal_options(options: FindOptions) -> FindOptions {
    FindOptions {
        use_regex: false,
        ..options
    }
}

fn byte_matches_to_utf16_matches(input: &str, matches: Vec<SearchMatch>) -> Vec<SearchMatch> {
    matches
        .into_iter()
        .map(|found| SearchMatch {
            start: byte_index_to_utf16_index(input, found.start),
            end: byte_index_to_utf16_index(input, found.end),
        })
        .collect()
}

fn byte_index_to_utf16_index(input: &str, byte_index: usize) -> usize {
    input[..byte_index].encode_utf16().count()
}

#[cfg(test)]
mod tests {
    use super::{byte_matches_to_utf16_matches, SearchMatch};

    #[test]
    fn converts_chinese_match_offsets_to_utf16_indices() {
        let matches = byte_matches_to_utf16_matches(
            "abc社会def",
            vec![SearchMatch { start: 3, end: 9 }],
        );

        assert_eq!(matches, vec![SearchMatch { start: 3, end: 5 }]);
    }
}
