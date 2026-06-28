//! Machine-facing routes: health, RSS feed, sitemap.

use axum::extract::State;
use axum::response::IntoResponse;
use sqlx::PgPool;

use crate::app::ports::ContentRepository;
use crate::config::site_url;
use crate::infra::repo::PgContentRepository;

pub async fn healthz() -> &'static str {
    "ok"
}

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

pub async fn feed(State(pool): State<PgPool>) -> impl IntoResponse {
    let posts = PgContentRepository::new(pool)
        .list_published_posts()
        .await
        .unwrap_or_default();
    let base = site_url();
    let items: String = posts
        .iter()
        .map(|p| {
            format!(
                "<item><title>{}</title><link>{base}/blog/{}</link><guid>{base}/blog/{}</guid></item>",
                xml_escape(&p.title),
                p.slug,
                p.slug
            )
        })
        .collect();
    let body = format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel>\
         <title>genuine·folio</title><link>{base}</link>\
         <description>Writing on Rust, systems, and security.</description>{items}</channel></rss>"
    );
    (
        [(
            axum::http::header::CONTENT_TYPE,
            "application/rss+xml; charset=utf-8",
        )],
        body,
    )
}

pub async fn sitemap(State(pool): State<PgPool>) -> impl IntoResponse {
    let repo = PgContentRepository::new(pool);
    let posts = repo.list_published_posts().await.unwrap_or_default();
    let projects = repo
        .list_published_by_kind("project")
        .await
        .unwrap_or_default();
    let base = site_url();
    let mut urls = format!(
        "<url><loc>{base}/</loc></url><url><loc>{base}/projects</loc></url>\
         <url><loc>{base}/about</loc></url>"
    );
    for p in posts {
        urls.push_str(&format!("<url><loc>{base}/blog/{}</loc></url>", p.slug));
    }
    for p in projects {
        urls.push_str(&format!("<url><loc>{base}/projects/{}</loc></url>", p.slug));
    }
    let body = format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
         <urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">{urls}</urlset>"
    );
    (
        [(
            axum::http::header::CONTENT_TYPE,
            "application/xml; charset=utf-8",
        )],
        body,
    )
}
