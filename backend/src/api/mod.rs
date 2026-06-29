//! HTTP/JSON API (inbound adapter) — maps requests to the application layer.

mod admin;
pub mod auth;
mod content;
mod error;
mod feeds;
mod newsletter;
mod notifications;
mod state;

pub use error::ApiError;
pub use state::AppState;

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::routing::{get, post};

/// All routes. `/api/*` is JSON; the top-level routes serve machine/email targets.
pub fn router() -> Router<AppState> {
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

fn api_routes() -> Router<AppState> {
    Router::new()
        .route("/posts", get(content::list_posts))
        .route("/posts/{slug}", get(content::get_doc))
        .route(
            "/posts/{slug}/comments",
            get(content::list_comments).post(content::create_comment),
        )
        .route("/projects", get(content::list_projects))
        .route("/projects/{slug}", get(content::get_doc))
        .route("/pages/{slug}", get(content::get_doc))
        .route("/search", get(content::search))
        .route("/auth/login", post(auth::login))
        .route("/auth/me", get(auth::me))
        .route("/admin/docs", get(admin::list).post(admin::save))
        .route("/admin/preview", post(admin::preview))
        .route("/admin/docs/{slug}", get(admin::get).delete(admin::delete))
        .route("/admin/docs/{slug}/duplicate", post(admin::duplicate))
        .route("/admin/docs/{slug}/revisions", get(admin::list_revisions))
        .route(
            "/admin/docs/{slug}/revisions/{id}",
            get(admin::get_revision),
        )
        .route(
            "/admin/upload",
            // Body limit slightly above the handler's 5MB cap to leave room for
            // multipart framing; the handler enforces the real per-file limit.
            post(admin::upload).layer(DefaultBodyLimit::max(6 * 1024 * 1024)),
        )
        .route("/admin/notifications", get(notifications::list))
        .route(
            "/admin/notifications/read",
            post(notifications::mark_read_handler),
        )
        .route(
            "/admin/notifications/read-all",
            post(notifications::mark_all_read_handler),
        )
        .route("/admin/notifications/ws", get(notifications::ws))
        .route("/newsletter/subscribe", post(newsletter::subscribe))
}
