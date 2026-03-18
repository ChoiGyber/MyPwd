use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserInfo {
    pub name: String,
    pub profile_path: String,
    pub browser_type: String,
}

/// Detects installed Chromium-based browsers on Windows by checking
/// standard installation paths under %LOCALAPPDATA%.
pub fn detect_installed_browsers() -> Vec<BrowserInfo> {
    let mut browsers = Vec::new();

    #[cfg(windows)]
    {
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let base = PathBuf::from(&local_app_data);

            let browser_paths = vec![
                ("Google Chrome", "Google/Chrome/User Data/Default", "chromium"),
                ("Microsoft Edge", "Microsoft/Edge/User Data/Default", "chromium"),
                ("Brave Browser", "BraveSoftware/Brave-Browser/User Data/Default", "chromium"),
            ];

            for (name, rel_path, browser_type) in browser_paths {
                let profile_path = base.join(rel_path);
                if profile_path.exists() {
                    browsers.push(BrowserInfo {
                        name: name.to_string(),
                        profile_path: profile_path.to_string_lossy().to_string(),
                        browser_type: browser_type.to_string(),
                    });
                }
            }
        }
    }

    browsers
}
