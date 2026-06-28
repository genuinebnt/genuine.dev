//! Application bootstrap: load config, connect the DB, run migrations, seed dev
//! data, build the router, and serve with graceful shutdown.

use axum::Router;
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use crate::config::Config;

type BoxError = Box<dyn std::error::Error>;

pub async fn run() -> Result<(), BoxError> {
    load_env();

    let config = Config::from_env()?;
    let pool = crate::infra::db::connect(&config.database_url).await?;
    crate::infra::db::migrate(&pool).await?;
    tracing::info!("database connected, migrations applied");

    seed_dev_content(&pool).await?;
    seed_admin(&pool).await?;

    let app = build_router(pool);
    let addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:3001".to_owned());
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("listening on http://{addr}");
    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

fn build_router(pool: PgPool) -> Router {
    crate::api::router()
        .layer(TraceLayer::new_for_http())
        // Dev: allow the frontend dev server. Tighten for production.
        .layer(CorsLayer::permissive())
        .with_state(pool)
}

fn load_env() {
    // Dev: project `.env` wins over any stray global var. Release: real env vars win.
    #[cfg(debug_assertions)]
    let _ = dotenvy::dotenv_override();
    #[cfg(not(debug_assertions))]
    let _ = dotenvy::dotenv();
}

async fn seed_dev_content(_pool: &PgPool) -> Result<(), BoxError> {
    #[cfg(debug_assertions)]
    crate::infra::seed::seed_if_empty(_pool).await?;
    Ok(())
}

/// Admin user: requires `ADMIN_PASSWORD` in production; defaults to admin/admin in dev.
async fn seed_admin(pool: &PgPool) -> Result<(), BoxError> {
    let user = std::env::var("ADMIN_USERNAME").unwrap_or_else(|_| "admin".to_owned());
    match std::env::var("ADMIN_PASSWORD") {
        Ok(password) => crate::infra::auth::seed_admin(pool, &user, &password).await?,
        Err(_) => {
            #[cfg(debug_assertions)]
            crate::infra::auth::seed_admin(pool, &user, "admin").await?;
        }
    }
    Ok(())
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("shutdown signal received, draining");
}
