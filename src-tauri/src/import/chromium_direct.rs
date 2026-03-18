use std::path::Path;

use super::ImportedCredential;

// TODO: Implement direct Chromium password reading using:
// 1. Read the "Login Data" SQLite database from the browser profile
// 2. Read the "Local State" JSON file to get the encrypted AES key
// 3. Decrypt the AES key using Windows DPAPI (CryptUnprotectData)
// 4. For v10 passwords: AES-GCM decrypt with the decrypted key
//    - Nonce: bytes 3..15 of the encrypted blob
//    - Ciphertext: bytes 15..end
// 5. For v11 passwords: similar to v10 but with different key derivation
// 6. For older passwords (no "v10"/"v11" prefix): use DPAPI directly
//
// Important: The browser must be closed while reading "Login Data"
// because the SQLite database is locked while the browser is running.

/// Attempts to read Chromium passwords directly from the browser profile.
/// Currently returns an error directing users to use CSV export instead.
pub fn read_chromium_passwords(_profile_path: &Path) -> Result<Vec<ImportedCredential>, String> {
    Err(
        "Direct browser password reading is not yet implemented. \
         Please use CSV export instead: \
         Chrome/Edge: Settings > Passwords > Export passwords"
            .to_string(),
    )
}
