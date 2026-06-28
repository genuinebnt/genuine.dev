//! Application configuration, loaded from the environment.

use crate::error::AppError;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
}

impl Config {
    pub fn from_env() -> Result<Self, AppError> {
        let database_url = std::env::var("DATABASE_URL")
            .map_err(|_| AppError::Config("DATABASE_URL is not set".into()))?;
        Ok(Self { database_url })
    }
}

/// Public base URL of the site (used in feeds, sitemap, and emails).
pub fn site_url() -> String {
    std::env::var("SITE_URL").unwrap_or_else(|_| "http://localhost:3000".to_owned())
}
