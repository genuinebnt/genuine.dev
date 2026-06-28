//! Postgres connection pool + migration runner.

use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

use crate::error::AppError;

pub async fn connect(database_url: &str) -> Result<PgPool, AppError> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;
    Ok(pool)
}

pub async fn migrate(pool: &PgPool) -> Result<(), AppError> {
    sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}
