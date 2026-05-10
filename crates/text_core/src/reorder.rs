use std::cmp::Ordering;
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

pub fn sort_lines_ascending(input: &str, numeric: bool) -> String {
    let mut lines = input.lines().collect::<Vec<_>>();
    if numeric {
        lines.sort_by(compare_numeric_lines);
    } else {
        lines.sort();
    }
    lines.join("\n")
}

pub fn sort_lines_descending(input: &str, numeric: bool) -> String {
    let mut lines = input.lines().collect::<Vec<_>>();
    if numeric {
        lines.sort_by(compare_numeric_lines_descending);
    } else {
        lines.sort_by(|left, right| right.cmp(left));
    }
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

fn compare_numeric_lines(left: &&str, right: &&str) -> Ordering {
    match (leading_integer(left), leading_integer(right)) {
        (Some(left_number), Some(right_number)) => left_number.cmp(&right_number).then_with(|| left.cmp(right)),
        (Some(_), None) => Ordering::Less,
        (None, Some(_)) => Ordering::Greater,
        (None, None) => left.cmp(right),
    }
}

fn compare_numeric_lines_descending(left: &&str, right: &&str) -> Ordering {
    match (leading_integer(left), leading_integer(right)) {
        (Some(left_number), Some(right_number)) => right_number.cmp(&left_number).then_with(|| right.cmp(left)),
        (Some(_), None) => Ordering::Less,
        (None, Some(_)) => Ordering::Greater,
        (None, None) => right.cmp(left),
    }
}

fn leading_integer(value: &str) -> Option<i64> {
    let mut end = 0;
    let mut chars = value.char_indices().peekable();

    if matches!(chars.peek(), Some((_, '-'))) {
        end = 1;
        chars.next();
    }

    let digit_start = end;
    for (index, character) in chars {
        if !character.is_ascii_digit() {
            break;
        }

        end = index + character.len_utf8();
    }

    if end == digit_start {
        return None;
    }

    value[..end].parse().ok()
}
