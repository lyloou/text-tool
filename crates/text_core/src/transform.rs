#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConvertMode {
    DoubleQuoted,
    SingleQuoted,
    Plain,
}

pub fn convert_lines(input: &str, mode: ConvertMode, ignore_empty_lines: bool) -> String {
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

    items.join(",")
}
