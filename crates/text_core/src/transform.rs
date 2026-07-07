#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConvertMode {
    DoubleQuoted,
    SingleQuoted,
    Plain,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConvertedLines {
    pub mode: ConvertMode,
    pub output: String,
}

pub fn convert_lines(
    input: &str,
    mode: ConvertMode,
    ignore_empty_lines: bool,
    wrap_with_parentheses: bool,
) -> String {
    let items = input
        .lines()
        .map(str::trim)
        .filter(|line| !ignore_empty_lines || !line.is_empty())
        .map(|line| match mode {
            ConvertMode::DoubleQuoted => format!("\"{line}\""),
            ConvertMode::SingleQuoted => format!("'{line}'"),
            ConvertMode::Plain => line.to_string(),
        })
        .collect::<Vec<_>>();

    let output = items.join(",");

    if wrap_with_parentheses {
        format!("({output})")
    } else {
        output
    }
}

pub fn convert_all_formats(
    input: &str,
    ignore_empty_lines: bool,
    wrap_with_parentheses: bool,
) -> Vec<ConvertedLines> {
    [
        ConvertMode::DoubleQuoted,
        ConvertMode::SingleQuoted,
        ConvertMode::Plain,
    ]
    .into_iter()
    .map(|mode| ConvertedLines {
        mode,
        output: convert_lines(input, mode, ignore_empty_lines, wrap_with_parentheses),
    })
    .collect()
}
