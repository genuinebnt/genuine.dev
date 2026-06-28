//! Admin content CRUD (JWT-guarded via the `AuthUser` extractor).

use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::api::ApiError;
use crate::api::auth::AuthUser;
use crate::app::ports::{ContentRepository, Renderer};
use crate::domain::{Document, Kind, Slug, Status};
use crate::infra::render::MarkdownRenderer;
use crate::infra::repo::PgContentRepository;

#[derive(Serialize)]
pub struct AdminItem {
    slug: String,
    title: String,
    kind: String,
    status: String,
}

#[derive(Serialize)]
pub struct EditDoc {
    slug: String,
    kind: String,
    title: String,
    summary: Option<String>,
    status: String,
    body_markdown: String,
}

#[derive(Deserialize)]
pub struct SaveReq {
    slug: String,
    kind: String,
    title: String,
    summary: String,
    status: String,
    body: String,
}

pub async fn list(
    _user: AuthUser,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<AdminItem>>, ApiError> {
    let docs = PgContentRepository::new(pool).list_all().await?;
    Ok(Json(
        docs.into_iter()
            .map(|d| AdminItem {
                slug: d.slug,
                title: d.title,
                kind: d.kind.as_str().to_owned(),
                status: d.status.as_str().to_owned(),
            })
            .collect(),
    ))
}

pub async fn get(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<EditDoc>, ApiError> {
    let doc = PgContentRepository::new(pool).get_by_slug(&slug).await?;
    doc.map(|d| {
        Json(EditDoc {
            slug: d.slug,
            kind: d.kind.as_str().to_owned(),
            title: d.title,
            summary: d.summary,
            status: d.status.as_str().to_owned(),
            body_markdown: d.body_markdown,
        })
    })
    .ok_or(ApiError::NotFound)
}

pub async fn save(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Json(req): Json<SaveReq>,
) -> Result<StatusCode, ApiError> {
    let slug = if req.slug.trim().is_empty() {
        Slug::from_title(&req.title)
    } else {
        Slug::parse(req.slug.trim())
    }
    .map_err(|_| ApiError::BadRequest("invalid slug/title".to_owned()))?
    .as_str()
    .to_owned();

    let status = Status::parse(&req.status).unwrap_or(Status::Draft);
    let rendered = MarkdownRenderer::new().render(&req.body);
    let doc = Document {
        id: uuid::Uuid::now_v7(),
        slug,
        kind: Kind::parse(&req.kind).unwrap_or(Kind::Post),
        title: req.title,
        summary: (!req.summary.trim().is_empty()).then_some(req.summary),
        body_markdown: req.body,
        body_html: rendered.html,
        reading_min: rendered.reading_min,
        status,
        published_at: matches!(status, Status::Published).then(time::OffsetDateTime::now_utc),
    };

    PgContentRepository::new(pool.clone()).upsert(&doc).await?;
    if matches!(doc.status, Status::Published) {
        crate::infra::subscribers::notify_new_post(&pool, &doc.title, &doc.slug).await;
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<StatusCode, ApiError> {
    PgContentRepository::new(pool).delete(&slug).await?;
    Ok(StatusCode::NO_CONTENT)
}
