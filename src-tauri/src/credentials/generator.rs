use rand::seq::SliceRandom;
use rand::RngCore;
use serde::{Deserialize, Serialize};

const UPPERCASE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE: &[u8] = b"abcdefghijklmnopqrstuvwxyz";
const NUMBERS: &[u8] = b"0123456789";
const SYMBOLS: &[u8] = b"!@#$%^&*()-_=+[]{}|;:',.<>?/~`";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratorOptions {
    pub length: u32,
    pub uppercase: bool,
    pub lowercase: bool,
    pub numbers: bool,
    pub symbols: bool,
}

impl Default for GeneratorOptions {
    fn default() -> Self {
        Self {
            length: 16,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
        }
    }
}

/// Generates a random password based on the given options.
pub fn generate_password(options: GeneratorOptions) -> String {
    let mut charset = Vec::new();
    let mut required = Vec::new();
    let mut rng = rand::rngs::OsRng;

    if options.uppercase {
        charset.extend_from_slice(UPPERCASE);
        required.push(UPPERCASE[rng.next_u32() as usize % UPPERCASE.len()]);
    }
    if options.lowercase {
        charset.extend_from_slice(LOWERCASE);
        required.push(LOWERCASE[rng.next_u32() as usize % LOWERCASE.len()]);
    }
    if options.numbers {
        charset.extend_from_slice(NUMBERS);
        required.push(NUMBERS[rng.next_u32() as usize % NUMBERS.len()]);
    }
    if options.symbols {
        charset.extend_from_slice(SYMBOLS);
        required.push(SYMBOLS[rng.next_u32() as usize % SYMBOLS.len()]);
    }

    if charset.is_empty() {
        // Fallback: use lowercase if nothing is selected
        charset.extend_from_slice(LOWERCASE);
    }

    let length = options.length.max(4) as usize;
    let mut password: Vec<u8> = Vec::with_capacity(length);

    // Add required characters first
    for ch in &required {
        password.push(*ch);
    }

    // Fill the rest randomly
    while password.len() < length {
        let idx = rng.next_u32() as usize % charset.len();
        password.push(charset[idx]);
    }

    // Shuffle the password so required chars aren't always at the start
    password.shuffle(&mut rng);

    String::from_utf8(password).unwrap_or_default()
}

/// Calculates password strength based on length and character diversity.
/// Returns "weak", "medium", or "strong".
pub fn calculate_strength(password: &str) -> &'static str {
    if password.is_empty() {
        return "weak";
    }

    let len = password.len();
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_lower = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_special = password.chars().any(|c| !c.is_alphanumeric());

    let variety_count = [has_upper, has_lower, has_digit, has_special]
        .iter()
        .filter(|&&v| v)
        .count();

    if len >= 12 && variety_count >= 3 {
        "strong"
    } else if len >= 8 && variety_count >= 2 {
        "medium"
    } else {
        "weak"
    }
}

#[tauri::command]
pub fn generate_password_cmd(options: GeneratorOptions) -> Result<String, String> {
    Ok(generate_password(options))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_password_length() {
        let options = GeneratorOptions {
            length: 20,
            ..Default::default()
        };
        let pwd = generate_password(options);
        assert_eq!(pwd.len(), 20);
    }

    #[test]
    fn test_calculate_strength() {
        assert_eq!(calculate_strength("abc"), "weak");
        assert_eq!(calculate_strength("Abcd1234"), "medium");
        assert_eq!(calculate_strength("Abcd1234!@#$"), "strong");
    }
}
