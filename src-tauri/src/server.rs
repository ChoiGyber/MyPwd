use std::sync::{Arc, Mutex};

use serde::{Deserialize, Serialize};
use warp::Filter;

type SharedDb = Arc<Mutex<Option<rusqlite::Connection>>>;

#[derive(Serialize)]
struct StatusResponse {
    status: String,
}

#[derive(Deserialize)]
struct SearchRequest {
    url: String,
}

#[derive(Serialize)]
struct SearchResponse {
    credentials: Vec<CredentialSummary>,
    status: Option<String>,
}

#[derive(Serialize)]
struct CredentialSummary {
    id: i64,
    title: String,
    username: String,
    url: Option<String>,
}

#[derive(Deserialize)]
struct AutofillRequest {
    id: i64,
}

#[derive(Serialize)]
struct AutofillResponse {
    username: Option<String>,
    password: Option<String>,
    error: Option<String>,
}

/// Extracts the domain from a URL string.
fn extract_domain(url: &str) -> Option<String> {
    // Remove protocol
    let without_proto = url
        .strip_prefix("https://")
        .or_else(|| url.strip_prefix("http://"))
        .unwrap_or(url);

    // Take everything before the first '/' or end
    let domain = without_proto.split('/').next()?;

    // Remove port if present
    let domain = domain.split(':').next()?;

    // Remove 'www.' prefix for broader matching
    let domain = domain.strip_prefix("www.").unwrap_or(domain);

    if domain.is_empty() {
        None
    } else {
        Some(domain.to_lowercase())
    }
}

fn with_db(db: SharedDb) -> impl Filter<Extract = (SharedDb,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || db.clone())
}

fn cors_headers() -> warp::cors::Builder {
    warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "OPTIONS"])
        .allow_headers(vec!["Content-Type"])
}

pub async fn start_server(db: SharedDb) {
    // GET /status
    let status = {
        let db = db.clone();
        warp::get()
            .and(warp::path("status"))
            .and(warp::path::end())
            .and(with_db(db))
            .map(|db: SharedDb| {
                let status = match db.lock() {
                    Ok(lock) => {
                        if lock.is_some() {
                            "unlocked"
                        } else {
                            "locked"
                        }
                    }
                    Err(_) => "locked",
                };
                warp::reply::json(&StatusResponse {
                    status: status.to_string(),
                })
            })
    };

    // POST /search
    let search = {
        let db = db.clone();
        warp::post()
            .and(warp::path("search"))
            .and(warp::path::end())
            .and(warp::body::json())
            .and(with_db(db))
            .map(|body: SearchRequest, db: SharedDb| {
                let db_lock = match db.lock() {
                    Ok(lock) => lock,
                    Err(_) => {
                        return warp::reply::json(&SearchResponse {
                            credentials: vec![],
                            status: Some("locked".to_string()),
                        });
                    }
                };

                let conn = match db_lock.as_ref() {
                    Some(c) => c,
                    None => {
                        return warp::reply::json(&SearchResponse {
                            credentials: vec![],
                            status: Some("locked".to_string()),
                        });
                    }
                };

                let domain = match extract_domain(&body.url) {
                    Some(d) => d,
                    None => {
                        return warp::reply::json(&SearchResponse {
                            credentials: vec![],
                            status: None,
                        });
                    }
                };

                let pattern = format!("%{}%", domain);
                let mut stmt = match conn.prepare(
                    "SELECT id, title, username, url FROM credentials WHERE url LIKE ?1 ORDER BY updated_at DESC",
                ) {
                    Ok(s) => s,
                    Err(_) => {
                        return warp::reply::json(&SearchResponse {
                            credentials: vec![],
                            status: None,
                        });
                    }
                };

                let rows = match stmt.query_map([&pattern], |row| {
                    Ok(CredentialSummary {
                        id: row.get(0)?,
                        title: row.get(1)?,
                        username: row.get(2)?,
                        url: row.get(3)?,
                    })
                }) {
                    Ok(rows) => rows,
                    Err(_) => {
                        return warp::reply::json(&SearchResponse {
                            credentials: vec![],
                            status: None,
                        });
                    }
                };

                let mut credentials = Vec::new();
                for row in rows {
                    if let Ok(cred) = row {
                        credentials.push(cred);
                    }
                }

                warp::reply::json(&SearchResponse {
                    credentials,
                    status: None,
                })
            })
    };

    // POST /autofill
    let autofill = {
        let db = db.clone();
        warp::post()
            .and(warp::path("autofill"))
            .and(warp::path::end())
            .and(warp::body::json())
            .and(with_db(db))
            .map(|body: AutofillRequest, db: SharedDb| {
                let db_lock = match db.lock() {
                    Ok(lock) => lock,
                    Err(_) => {
                        return warp::reply::json(&AutofillResponse {
                            username: None,
                            password: None,
                            error: Some("Database locked".to_string()),
                        });
                    }
                };

                let conn = match db_lock.as_ref() {
                    Some(c) => c,
                    None => {
                        return warp::reply::json(&AutofillResponse {
                            username: None,
                            password: None,
                            error: Some("Database locked".to_string()),
                        });
                    }
                };

                match conn.query_row(
                    "SELECT username, password FROM credentials WHERE id = ?1",
                    [body.id],
                    |row| {
                        Ok((
                            row.get::<_, String>(0)?,
                            row.get::<_, String>(1)?,
                        ))
                    },
                ) {
                    Ok((username, password)) => warp::reply::json(&AutofillResponse {
                        username: Some(username),
                        password: Some(password),
                        error: None,
                    }),
                    Err(e) => warp::reply::json(&AutofillResponse {
                        username: None,
                        password: None,
                        error: Some(format!("Credential not found: {}", e)),
                    }),
                }
            })
    };

    let routes = status
        .or(search)
        .or(autofill)
        .with(cors_headers());

    warp::serve(routes)
        .run(([127, 0, 0, 1], 27183))
        .await;
}
