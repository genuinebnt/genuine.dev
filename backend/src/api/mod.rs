//! HTTP/JSON API (inbound adapter) — maps requests to the application layer.

mod admin;
pub mod auth;
mod content;
mod error;
mod feeds;
mod newsletter;

pub use error::ApiError;

use axum::Router;
use axum::routing::{get, post};
use sqlx::PgPool;

/// All routes. `/api/*` is JSON; the top-level routes serve machine/email targets.
pub fn router() -> Router<PgPool> {
    Router::new()
        .route("/healthz", get(feeds::healthz))
        .route("/feed.xml", get(feeds::feed))
        .route("/sitemap.xml", get(feeds::sitemap))
        .route("/newsletter/confirm/{token}", get(newsletter::confirm))
        .route(
            "/newsletter/unsubscribe/{token}",
            get(newsletter::unsubscribe),
        )
        .nest("/api", api_routes())
}

fn api_routes() -> Router<PgPool> {
    Router::new()
        .route("/posts", get(content::list_posts))
        .route("/posts/{slug}", get(content::get_doc))
        .route("/projects", get(content::list_projects))
        .route("/projects/{slug}", get(content::get_doc))
        .route("/pages/{slug}", get(content::get_doc))
        .route("/search", get(content::search))
        .route("/auth/login", post(auth::login))
        .route("/auth/me", get(auth::me))
        .route("/admin/docs", get(admin::list).post(admin::save))
        .route("/admin/docs/{slug}", get(admin::get).delete(admin::delete))
        .route("/newsletter/subscribe", post(newsletter::subscribe))
}
