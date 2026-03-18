use super::ImportedCredential;

/// Parses a CSV string and auto-detects the browser format.
/// Returns (browser_name, credentials).
pub fn parse_csv(content: &str) -> Result<(String, Vec<ImportedCredential>), String> {
    // Strip BOM if present (common in Korean software exports)
    let content = content.trim_start_matches('\u{feff}');

    let mut reader = csv::ReaderBuilder::new()
        .flexible(true)
        .has_headers(true)
        .from_reader(content.as_bytes());

    let headers = reader
        .headers()
        .map_err(|e| format!("Failed to read CSV headers: {}", e))?
        .clone();

    let header_lower: Vec<String> = headers
        .iter()
        .map(|h| h.to_lowercase().trim().to_string())
        .collect();

    // Try to find column indices flexibly
    let name_idx = find_column(&header_lower, &["name", "이름", "title", "사이트명"]);
    let url_idx = find_column(&header_lower, &["url", "uri", "주소", "website", "웹사이트", "사이트"]);
    let username_idx = find_column(&header_lower, &["username", "user name", "login", "아이디", "사용자 이름", "사용자이름", "id", "user_name", "login_uri"]);
    let password_idx = find_column(&header_lower, &["password", "비밀번호", "passwd", "pw"]);
    let note_idx = find_column(&header_lower, &["note", "notes", "메모", "비고"]);

    // Detect browser type
    let browser_name = detect_browser(&header_lower);

    // We need at least username and password columns
    let username_idx = username_idx.ok_or_else(|| {
        format!(
            "CSV 파일에서 아이디(username) 컬럼을 찾을 수 없습니다. 발견된 헤더: {}",
            header_lower.join(", ")
        )
    })?;
    let password_idx = password_idx.ok_or_else(|| {
        format!(
            "CSV 파일에서 비밀번호(password) 컬럼을 찾을 수 없습니다. 발견된 헤더: {}",
            header_lower.join(", ")
        )
    })?;

    let mut credentials = Vec::new();

    for result in reader.records() {
        let record = result.map_err(|e| format!("Failed to read CSV record: {}", e))?;

        let username = record.get(username_idx).unwrap_or("").trim().to_string();
        let password = record.get(password_idx).unwrap_or("").trim().to_string();

        // Skip entries with empty username and password
        if username.is_empty() && password.is_empty() {
            continue;
        }

        let url = url_idx
            .and_then(|i| record.get(i))
            .map(|s| s.trim().to_string())
            .unwrap_or_default();

        let title = name_idx
            .and_then(|i| record.get(i))
            .map(|s| s.trim().to_string())
            .unwrap_or_default();

        let title = if title.is_empty() {
            extract_domain(&url)
        } else {
            title
        };

        let _note = note_idx
            .and_then(|i| record.get(i))
            .map(|s| s.trim().to_string());

        credentials.push(ImportedCredential {
            title,
            url: if url.is_empty() { None } else { Some(url) },
            username,
            password,
            source: Some(browser_name.clone()),
        });
    }

    if credentials.is_empty() {
        return Err("CSV 파일에서 가져올 자격증명이 없습니다.".to_string());
    }

    Ok((browser_name, credentials))
}

/// Find a column index by trying multiple possible header names.
fn find_column(headers: &[String], candidates: &[&str]) -> Option<usize> {
    for candidate in candidates {
        if let Some(idx) = headers.iter().position(|h| h == *candidate) {
            return Some(idx);
        }
    }
    // Partial match fallback
    for candidate in candidates {
        if let Some(idx) = headers.iter().position(|h| h.contains(candidate)) {
            return Some(idx);
        }
    }
    None
}

/// Detect browser type from CSV headers.
fn detect_browser(headers: &[String]) -> String {
    let joined = headers.join(" ");

    if joined.contains("httprealm") || joined.contains("formactionorigin") {
        return "Firefox".to_string();
    }
    if joined.contains("name") && joined.contains("url") && joined.contains("username") {
        // Could be Chrome, Edge, Whale, Brave - all Chromium
        return "Chromium".to_string();
    }
    if headers.iter().any(|h| h.contains("이름") || h.contains("사이트") || h.contains("아이디")) {
        return "Whale".to_string();
    }

    "Unknown".to_string()
}

/// Extracts a human-readable domain name from a URL.
fn extract_domain(url: &str) -> String {
    let cleaned = url
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_start_matches("www.");

    match cleaned.split('/').next() {
        Some(domain) if !domain.is_empty() => domain.to_string(),
        _ => "Unknown".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_chrome_csv() {
        let csv_content =
            "name,url,username,password\nGoogle,https://accounts.google.com,user@gmail.com,secret123\n";
        let (browser, creds) = parse_csv(csv_content).unwrap();
        assert_eq!(browser, "Chromium");
        assert_eq!(creds.len(), 1);
        assert_eq!(creds[0].title, "Google");
        assert_eq!(creds[0].username, "user@gmail.com");
    }

    #[test]
    fn test_parse_firefox_csv() {
        let csv_content = "url,username,password,httpRealm,formActionOrigin\nhttps://example.com,user,pass,,https://example.com\n";
        let (browser, creds) = parse_csv(csv_content).unwrap();
        assert_eq!(browser, "Firefox");
        assert_eq!(creds.len(), 1);
        assert_eq!(creds[0].title, "example.com");
    }

    #[test]
    fn test_parse_with_bom() {
        let csv_content =
            "\u{feff}name,url,username,password\nTest,https://test.com,user,pass\n";
        let (_, creds) = parse_csv(csv_content).unwrap();
        assert_eq!(creds.len(), 1);
    }

    #[test]
    fn test_extract_domain() {
        assert_eq!(extract_domain("https://www.google.com/login"), "google.com");
        assert_eq!(extract_domain("http://example.com"), "example.com");
    }
}
