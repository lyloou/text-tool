mod reorder;
mod replace;
mod search;
mod transform;

pub use reorder::{comma_values_to_lines, deduplicate_lines, reverse_lines, sort_lines_ascending};
pub use replace::replace_text;
pub use search::{SearchMatch, search_matches};
pub use transform::{ConvertMode, convert_lines};

#[cfg(test)]
mod tests {
    use super::{
        ConvertMode, SearchMatch, comma_values_to_lines, convert_lines, deduplicate_lines,
        replace_text, reverse_lines, search_matches, sort_lines_ascending,
    };

    #[test]
    fn converts_to_double_quoted_values() {
        let output = convert_lines("line1\nline2", ConvertMode::DoubleQuoted, true);
        assert_eq!(output, "\"line1\",\"line2\"");
    }

    #[test]
    fn keeps_empty_lines_when_switch_is_off() {
        let output = convert_lines("line1\n\nline2", ConvertMode::Plain, false);
        assert_eq!(output, "line1,,line2");
    }

    #[test]
    fn trims_each_line_before_joining() {
        let output = convert_lines(" 你好 \n world ", ConvertMode::SingleQuoted, true);
        assert_eq!(output, "'你好','world'");
    }

    #[test]
    fn replaces_plain_text() {
        let output = replace_text("alpha beta alpha", "alpha", "omega");
        assert_eq!(output, "omega beta omega");
    }

    #[test]
    fn returns_original_text_when_find_is_empty() {
        let output = replace_text("alpha beta", "", "omega");
        assert_eq!(output, "alpha beta");
    }

    #[test]
    fn reverses_lines_in_source_order() {
        let output = reverse_lines("line1\nline2\nline3");
        assert_eq!(output, "line3\nline2\nline1");
    }

    #[test]
    fn deduplicates_lines_and_keeps_first_occurrence_order() {
        let output = deduplicate_lines("beta\nalpha\nbeta\n\nalpha\n");
        assert_eq!(output, "beta\nalpha\n");
    }

    #[test]
    fn sorts_lines_in_ascending_order() {
        let output = sort_lines_ascending("beta\nalpha\nGamma");
        assert_eq!(output, "Gamma\nalpha\nbeta");
    }

    #[test]
    fn converts_double_quoted_comma_values_to_lines() {
        let output = comma_values_to_lines("\"line1\",\"line2\"");
        assert_eq!(output, "line1\nline2");
    }

    #[test]
    fn converts_single_quoted_comma_values_to_lines() {
        let output = comma_values_to_lines("'line1','line2'");
        assert_eq!(output, "line1\nline2");
    }

    #[test]
    fn converts_plain_comma_values_to_lines_and_ignores_empty_items() {
        let output = comma_values_to_lines(" line1, , line2,,line3 ");
        assert_eq!(output, "line1\nline2\nline3");
    }

    #[test]
    fn finds_case_sensitive_matches() {
        let matches = search_matches("line1,line2,line1", "line1", true);
        assert_eq!(
            matches,
            vec![
                SearchMatch { start: 0, end: 5 },
                SearchMatch { start: 12, end: 17 },
            ]
        );
    }

    #[test]
    fn finds_case_insensitive_matches() {
        let matches = search_matches("Line,line,LINE", "line", false);
        assert_eq!(
            matches,
            vec![
                SearchMatch { start: 0, end: 4 },
                SearchMatch { start: 5, end: 9 },
                SearchMatch { start: 10, end: 14 },
            ]
        );
    }
}
