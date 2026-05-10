pub fn replace_text(input: &str, find: &str, replace_with: &str) -> String {
    if find.is_empty() {
        return input.to_string();
    }

    input.replace(find, replace_with)
}
