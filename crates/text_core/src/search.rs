use regex::RegexBuilder;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct SearchMatch {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FindOptions {
    pub case_sensitive: bool,
    pub whole_word: bool,
    pub use_regex: bool,
}

pub fn search_matches(output: &str, query: &str, options: FindOptions) -> Result<Vec<SearchMatch>, String> {
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let regex = build_find_regex(query, options)?;

    Ok(regex
        .find_iter(output)
        .map(|found| SearchMatch {
            start: found.start(),
            end: found.end(),
        })
        .collect())
}

pub(crate) fn build_find_regex(query: &str, options: FindOptions) -> Result<regex::Regex, String> {
    let mut pattern = if options.use_regex {
        query.to_string()
    } else {
        regex::escape(query)
    };

    if options.whole_word {
        pattern = format!(r"\b(?:{})\b", pattern);
    }

    RegexBuilder::new(&pattern)
        .case_insensitive(!options.case_sensitive)
        .build()
        .map_err(|error| error.to_string())
}
