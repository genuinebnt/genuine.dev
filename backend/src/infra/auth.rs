//! Password hashing (argon2) + admin user lookup/seed.

use argon2::Argon2;
use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| AppError::Config(format!("password hash: {e}")))
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    match PasswordHash::new(hash) {
        Ok(parsed) => Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok(),
        Err(_) => false,
    }
}

/// Returns `(id, password_hash)` for a username, if it exists.
pub async fn find_credentials(
    pool: &PgPool,
    username: &str,
) -> Result<Option<(Uuid, String)>, AppError> {
    let row = sqlx::query_as::<_, (Uuid, String)>(
        "select id, password_hash from users where username = $1",
    )
    .bind(username)
    .fetch_optional(pool)
    .await?;
    Ok(row)
}

/// Creates the admin user if absent.
pub async fn seed_admin(pool: &PgPool, username: &str, password: &str) -> Result<(), AppError> {
    let (count,): (i64,) = sqlx::query_as("select count(*) from users where username = $1")
        .bind(username)
        .fetch_one(pool)
        .await?;
    if count > 0 {
        return Ok(());
    }
    let hash = hash_password(password)?;
    sqlx::query("insert into users (id, username, password_hash) values ($1, $2, $3)")
        .bind(Uuid::now_v7())
        .bind(username)
        .bind(hash)
        .execute(pool)
        .await?;
    tracing::info!("seeded admin user '{username}'");
    Ok(())
}
