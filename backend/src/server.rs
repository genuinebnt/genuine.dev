//! Application bootstrap: load config, connect the DB, run migrations, seed dev
//! data, build the router, and serve with graceful shutdown.

use axum::Router;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tower_http::trace::TraceLayer;

use crate::api::AppState;
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

    let state = AppState::new(pool);
    crate::infra::scheduler::spawn_scheduled_publish_worker(
        state.pool.clone(),
        state.notifications.clone(),
    );

    // Ensure the uploads dir exists so `ServeDir` and the upload handler agree.
    let upload_dir = crate::config::upload_dir();
    tokio::fs::create_dir_all(&upload_dir).await?;

    let app = build_router(state, upload_dir);
    let addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:3001".to_owned());
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("listening on http://{addr}");
    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

fn build_router(state: AppState, upload_dir: String) -> Router {
    crate::api::router()
        .nest_service("/uploads", ServeDir::new(upload_dir))
        .layer(TraceLayer::new_for_http())
        // Dev: allow the frontend dev server. Tighten for production.
        .layer(CorsLayer::permissive())
        .with_state(state)
}

fn load_env() {
    // Dev: project `.env` wins over any stray global var. Release: real env vars win.
    #[cfg(debug_assertions)]
    let _ = dotenvy::dotenv_override();
    #[cfg(not(debug_assertions))]
    let _ = dotenvy::dotenv();
}

async fn seed_dev_content(pool: &sqlx::PgPool) -> Result<(), BoxError> {
    #[cfg(debug_assertions)]
    {
        crate::infra::seed::seed_if_empty(pool).await?;
        crate::infra::seed::seed_missing(pool).await?;
    }
    Ok(())
}

/// Admin user: requires `ADMIN_PASSWORD` in production; defaults to admin/admin in dev.
async fn seed_admin(pool: &sqlx::PgPool) -> Result<(), BoxError> {
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
