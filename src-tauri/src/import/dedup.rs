use super::{DuplicateInfo, DuplicateStatus, ImportedCredential};
use crate::credentials::Credential;

/// Normalizes a URL by removing protocol, www prefix, and trailing slashes.
pub fn normalize_url(url: &str) -> String {
    let cleaned = url
        .trim()
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_start_matches("www.")
        .trim_end_matches('/');
    cleaned.to_lowercase()
}

/// Checks imported credentials against existing ones to detect duplicates.
/// Comparison is based on normalized URL + lowercase username.
pub fn check_duplicates(
    imported: &[ImportedCredential],
    existing: &[Credential],
) -> Vec<DuplicateInfo> {
    imported
        .iter()
        .map(|imp| {
            let imp_url = normalize_url(imp.url.as_deref().unwrap_or(""));
            let imp_user = imp.username.to_lowercase();

            let matching_existing = existing.iter().find(|ex| {
                let ex_url = normalize_url(ex.url.as_deref().unwrap_or(""));
                let ex_user = ex.username.to_lowercase();
                ex_url == imp_url && ex_user == imp_user && !imp_url.is_empty()
            });

            match matching_existing {
                Some(ex) => {
                    if ex.password == imp.password {
                        DuplicateInfo {
                            imported: imp.clone(),
                            existing: Some(ex.clone()),
                            status: DuplicateStatus::ExactDuplicate,
                        }
                    } else {
                        DuplicateInfo {
                            imported: imp.clone(),
                            existing: Some(ex.clone()),
                            status: DuplicateStatus::Conflict,
                        }
                    }
                }
                None => DuplicateInfo {
                    imported: imp.clone(),
                    existing: None,
                    status: DuplicateStatus::New,
                },
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_url() {
        assert_eq!(normalize_url("https://www.Example.com/"), "example.com");
        assert_eq!(normalize_url("http://example.com/path/"), "example.com/path");
        assert_eq!(normalize_url("example.com"), "example.com");
    }

    #[test]
    fn test_check_duplicates_new() {
        let imported = vec![ImportedCredential {
            title: "Test".to_string(),
            url: Some("https://example.com".to_string()),
            username: "user".to_string(),
            password: "pass".to_string(),
            source: None,
        }];
        let existing: Vec<Credential> = vec![];
        let results = check_duplicates(&imported, &existing);
        assert_eq!(results.len(), 1);
        assert!(matches!(results[0].status, DuplicateStatus::New));
    }
}
