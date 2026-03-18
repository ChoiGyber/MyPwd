use hmac::Hmac;
use pbkdf2::pbkdf2;
use rand::RngCore;
use sha2::Sha256;
use zeroize::Zeroize;

const PBKDF2_ITERATIONS: u32 = 600_000;
const KEY_LENGTH: usize = 32;
const SALT_LENGTH: usize = 32;

type HmacSha256 = Hmac<Sha256>;

/// Derives a 32-byte key from a password and salt using PBKDF2-HMAC-SHA256.
pub fn derive_key(password: &str, salt: &[u8]) -> Vec<u8> {
    let mut key = vec![0u8; KEY_LENGTH];
    pbkdf2::<HmacSha256>(password.as_bytes(), salt, PBKDF2_ITERATIONS, &mut key)
        .expect("PBKDF2 key derivation failed");
    key
}

/// Generates a 32-byte random salt.
pub fn generate_salt() -> Vec<u8> {
    let mut salt = vec![0u8; SALT_LENGTH];
    rand::rngs::OsRng.fill_bytes(&mut salt);
    salt
}

/// Verifies a master password against a stored hash by re-deriving the key
/// and comparing in constant time.
pub fn verify_master_password(password: &str, salt: &[u8], stored_hash: &[u8]) -> bool {
    let mut derived = derive_key(password, salt);
    let result = constant_time_eq(&derived, stored_hash);
    derived.zeroize();
    result
}

/// Constant-time byte comparison to prevent timing attacks.
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_key_deterministic() {
        let salt = vec![0u8; 32];
        let key1 = derive_key("test_password", &salt);
        let key2 = derive_key("test_password", &salt);
        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);
    }

    #[test]
    fn test_generate_salt_unique() {
        let s1 = generate_salt();
        let s2 = generate_salt();
        assert_ne!(s1, s2);
        assert_eq!(s1.len(), 32);
    }

    #[test]
    fn test_verify_master_password() {
        let salt = generate_salt();
        let key = derive_key("my_password", &salt);
        assert!(verify_master_password("my_password", &salt, &key));
        assert!(!verify_master_password("wrong_password", &salt, &key));
    }
}
