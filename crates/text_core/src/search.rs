use regex::RegexBuilder;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct SearchMatch {
    pub start: usize,
    pub end: usize,
}

pub fn search_matches(output: &str, query: &str, case_sensitive: bool) -> Vec<SearchMatch> {
    if query.is_empty() {
        return Vec::new();
    }

    let pattern = regex::escape(query);
    let regex = RegexBuilder::new(&pattern)
        .case_insensitive(!case_sensitive)
        .build()
        .expect("escaped query should always compile");

    regex
        .find_iter(output)
        .map(|found| SearchMatch {
            start: found.start(),
            end: found.end(),
        })
        .collect()
}
