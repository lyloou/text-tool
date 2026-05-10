use std::collections::HashSet;

pub fn reverse_lines(input: &str) -> String {
    input.lines().rev().collect::<Vec<_>>().join("\n")
}

pub fn deduplicate_lines(input: &str) -> String {
    let mut seen = HashSet::new();
    input
        .lines()
        .filter(|line| seen.insert((*line).to_string()))
        .collect::<Vec<_>>()
        .join("\n")
}

pub fn sort_lines_ascending(input: &str) -> String {
    let mut lines = input.lines().collect::<Vec<_>>();
    lines.sort();
    lines.join("\n")
}

pub fn comma_values_to_lines(input: &str) -> String {
    input
        .split(',')
        .map(str::trim)
        .map(strip_wrapping_quotes)
        .filter(|value| !value.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

fn strip_wrapping_quotes(value: &str) -> &str {
    if value.len() < 2 {
        return value;
    }

    let mut chars = value.chars();
    let first = chars.next();
    let last = chars.next_back();

    match (first, last) {
        (Some('"'), Some('"')) | (Some('\''), Some('\'')) => chars.as_str(),
        _ => value,
    }
}
