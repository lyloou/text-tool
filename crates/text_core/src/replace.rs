use crate::search::{FindOptions, build_find_regex};

pub fn replace_text(input: &str, find: &str, replace_with: &str) -> String {
    if find.is_empty() {
        return input.to_string();
    }

    input.replace(find, replace_with)
}

pub fn replace_first(input: &str, find: &str, replace_with: &str, options: FindOptions) -> Result<String, String> {
    if find.is_empty() {
        return Ok(input.to_string());
    }

    let regex = build_find_regex(find, options)?;
    Ok(regex.replacen(input, 1, replace_with).to_string())
}

pub fn replace_all(input: &str, find: &str, replace_with: &str, options: FindOptions) -> Result<String, String> {
    if find.is_empty() {
        return Ok(input.to_string());
    }

    let regex = build_find_regex(find, options)?;
    Ok(regex.replace_all(input, replace_with).to_string())
}
