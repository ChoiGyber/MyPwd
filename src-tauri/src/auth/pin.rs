/// Hashes a PIN code using bcrypt with cost factor 12.
pub fn hash_pin(pin: &str) -> Result<String, String> {
    bcrypt::hash(pin, 12).map_err(|e| format!("Failed to hash PIN: {}", e))
}

/// Verifies a PIN code against a bcrypt hash.
pub fn verify_pin(pin: &str, hash: &str) -> Result<bool, String> {
    bcrypt::verify(pin, hash).map_err(|e| format!("Failed to verify PIN: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pin_hash_and_verify() {
        let hash = hash_pin("1234").unwrap();
        assert!(verify_pin("1234", &hash).unwrap());
        assert!(!verify_pin("0000", &hash).unwrap());
    }
}
