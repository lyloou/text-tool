mod reorder;
mod replace;
mod search;
mod transform;

pub use reorder::{
    comma_values_to_lines, deduplicate_lines, reverse_lines, sort_lines_ascending,
    sort_lines_descending,
};
pub use replace::{replace_all, replace_first, replace_text};
pub use search::{FindOptions, SearchMatch, search_matches};
pub use transform::{ConvertMode, ConvertedLines, convert_all_formats, convert_lines};

#[cfg(test)]
mod tests {
    use super::{
        ConvertMode, SearchMatch, comma_values_to_lines, convert_all_formats, convert_lines,
        deduplicate_lines, FindOptions, replace_all, replace_first, replace_text, reverse_lines,
        search_matches, sort_lines_ascending, sort_lines_descending,
    };

    #[test]
    fn converts_to_double_quoted_values() {
        let output = convert_lines("line1\nline2", ConvertMode::DoubleQuoted, true, false);
        assert_eq!(output, "\"line1\",\"line2\"");
    }

    #[test]
    fn keeps_empty_lines_when_switch_is_off() {
        let output = convert_lines("line1\n\nline2", ConvertMode::Plain, false, false);
        assert_eq!(output, "line1,,line2");
    }

    #[test]
    fn trims_each_line_before_joining() {
        let output = convert_lines(" 你好 \n world ", ConvertMode::SingleQuoted, true, false);
        assert_eq!(output, "'你好','world'");
    }

    #[test]
    fn wraps_converted_values_with_parentheses() {
        let output = convert_lines("line1\nline2", ConvertMode::DoubleQuoted, true, true);
        assert_eq!(output, "(\"line1\",\"line2\")");
    }

    #[test]
    fn converts_all_formats_in_fixed_order() {
        let output = convert_all_formats("line1\nline2", true, false);

        assert_eq!(output[0].mode, ConvertMode::DoubleQuoted);
        assert_eq!(output[0].output, "\"line1\",\"line2\"");
        assert_eq!(output[1].mode, ConvertMode::SingleQuoted);
        assert_eq!(output[1].output, "'line1','line2'");
        assert_eq!(output[2].mode, ConvertMode::Plain);
        assert_eq!(output[2].output, "line1,line2");
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
    fn deduplicates_empty_lines_as_lines() {
        let output = deduplicate_lines("alpha\n\nbeta\n\n");
        assert_eq!(output, "alpha\n\nbeta");
    }

    #[test]
    fn sorts_lines_in_ascending_order() {
        let output = sort_lines_ascending("beta\nalpha\nGamma", false);
        assert_eq!(output, "Gamma\nalpha\nbeta");
    }

    #[test]
    fn sorts_lines_in_descending_order() {
        let output = sort_lines_descending("beta\nalpha\nGamma", false);
        assert_eq!(output, "beta\nalpha\nGamma");
    }

    #[test]
    fn sorts_lines_by_leading_numbers_in_ascending_order() {
        let output = sort_lines_ascending("123 item\n38 item\n-4 item\nabc", true);
        assert_eq!(output, "-4 item\n38 item\n123 item\nabc");
    }

    #[test]
    fn sorts_lines_by_leading_numbers_in_descending_order() {
        let output = sort_lines_descending("123 item\n38 item\n-4 item\nabc", true);
        assert_eq!(output, "123 item\n38 item\n-4 item\nabc");
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
        let matches = search_matches("line1,line2,line1", "line1", find_options(true, false, false)).unwrap();
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
        let matches = search_matches("Line,line,LINE", "line", find_options(false, false, false)).unwrap();
        assert_eq!(
            matches,
            vec![
                SearchMatch { start: 0, end: 4 },
                SearchMatch { start: 5, end: 9 },
                SearchMatch { start: 10, end: 14 },
            ]
        );
    }

    #[test]
    fn finds_whole_word_matches() {
        let matches = search_matches("cat catalog cat_1 cat", "cat", find_options(true, true, false)).unwrap();
        assert_eq!(
            matches,
            vec![
                SearchMatch { start: 0, end: 3 },
                SearchMatch { start: 18, end: 21 },
            ]
        );
    }

    #[test]
    fn finds_regex_matches() {
        let matches = search_matches("item-1 item-22 item-x", r"item-\d+", find_options(true, false, true)).unwrap();
        assert_eq!(
            matches,
            vec![
                SearchMatch { start: 0, end: 6 },
                SearchMatch { start: 7, end: 14 },
            ]
        );
    }

    #[test]
    fn returns_regex_errors() {
        let result = search_matches("text", "(", find_options(true, false, true));
        assert!(result.is_err());
    }

    #[test]
    fn replaces_first_match_with_options() {
        let output = replace_first("Alpha alpha alpha", "alpha", "omega", find_options(false, false, false)).unwrap();
        assert_eq!(output, "omega alpha alpha");
    }

    #[test]
    fn replaces_all_matches_with_options() {
        let output = replace_all("cat catalog cat", "cat", "dog", find_options(true, true, false)).unwrap();
        assert_eq!(output, "dog catalog dog");
    }

    #[test]
    fn replaces_regex_captures() {
        let output = replace_all("item-1 item-22", r"item-(\d+)", "id-$1", find_options(true, false, true)).unwrap();
        assert_eq!(output, "id-1 id-22");
    }

    fn find_options(case_sensitive: bool, whole_word: bool, use_regex: bool) -> FindOptions {
        FindOptions {
            case_sensitive,
            whole_word,
            use_regex,
        }
    }
}
