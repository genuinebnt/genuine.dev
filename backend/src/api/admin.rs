//! Admin content CRUD (JWT-guarded via the `AuthUser` extractor).

use axum::Json;
use axum::extract::{Multipart, Path, State};
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::api::ApiError;
use crate::api::auth::AuthUser;
use crate::app::ports::{ContentRepository, Renderer, StorageBackend};
use crate::domain::{Document, Kind, Slug, Status};
use crate::infra::render::MarkdownRenderer;
use crate::infra::repo::PgContentRepository;
use crate::infra::storage::LocalDiskStorage;

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
    cover_image: Option<String>,
    metadata: serde_json::Value,
}

#[derive(Deserialize)]
pub struct SaveReq {
    slug: String,
    kind: String,
    title: String,
    summary: String,
    status: String,
    body: String,
    #[serde(default)]
    cover_image: Option<String>,
    #[serde(default)]
    metadata: serde_json::Value,
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
            cover_image: d.cover_image,
            metadata: d.metadata,
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
    // A missing/`null` metadata payload normalizes to an empty object so the column
    // is always a JSON object rather than SQL null.
    let metadata = match req.metadata {
        serde_json::Value::Null => serde_json::Value::Object(Default::default()),
        other => other,
    };
    let cover_image = req
        .cover_image
        .map(|s| s.trim().to_owned())
        .filter(|s| !s.is_empty());
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
        cover_image,
        metadata,
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

// ── Image upload ────────────────────────────────────────────────────────────────

/// Hard cap regardless of the route body limit (defence in depth).
const MAX_UPLOAD_BYTES: usize = 5 * 1024 * 1024;

#[derive(Serialize)]
pub struct UploadOut {
    url: String,
}

/// Accepts a single multipart file field, validates it is a supported image by
/// sniffing its magic bytes, and stores it via the `StorageBackend` port.
pub async fn upload(
    _user: AuthUser,
    mut multipart: Multipart,
) -> Result<Json<UploadOut>, ApiError> {
    let field = multipart
        .next_field()
        .await
        .map_err(|_| ApiError::BadRequest("invalid multipart body".to_owned()))?
        .ok_or_else(|| ApiError::BadRequest("no file field in request".to_owned()))?;

    let data = field
        .bytes()
        .await
        .map_err(|_| ApiError::BadRequest("file too large or unreadable".to_owned()))?;

    if data.len() > MAX_UPLOAD_BYTES {
        return Err(ApiError::BadRequest(
            "file exceeds the 5MB limit".to_owned(),
        ));
    }
    let extension = sniff_image_extension(&data)
        .ok_or_else(|| ApiError::BadRequest("unsupported image type".to_owned()))?;

    let storage = LocalDiskStorage::new(crate::config::upload_dir());
    let url = storage.put(&data, extension).await?;
    Ok(Json(UploadOut { url }))
}

/// Identify a supported image from its leading bytes; `None` rejects the upload.
fn sniff_image_extension(bytes: &[u8]) -> Option<&'static str> {
    if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        return Some("png");
    }
    if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return Some("jpg");
    }
    if bytes.starts_with(b"GIF8") {
        return Some("gif");
    }
    if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        return Some("webp");
    }
    // SVG is text/XML — check the leading non-whitespace markup.
    if let Ok(text) = std::str::from_utf8(&bytes[..bytes.len().min(256)]) {
        let head = text.trim_start_matches('\u{feff}').trim_start();
        if head.starts_with("<?xml") || head.starts_with("<svg") {
            return Some("svg");
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::sniff_image_extension;

    #[test]
    fn recognizes_supported_image_magic_bytes() {
        assert_eq!(
            sniff_image_extension(&[0x89, 0x50, 0x4E, 0x47, 0x0D]),
            Some("png")
        );
        assert_eq!(
            sniff_image_extension(&[0xFF, 0xD8, 0xFF, 0xE0]),
            Some("jpg")
        );
        assert_eq!(sniff_image_extension(b"GIF89a..."), Some("gif"));
        assert_eq!(sniff_image_extension(b"RIFF\0\0\0\0WEBPVP8 "), Some("webp"));
        assert_eq!(sniff_image_extension(b"  <svg xmlns=\"\">"), Some("svg"));
    }

    #[test]
    fn rejects_non_image_payloads() {
        assert_eq!(sniff_image_extension(b"#!/bin/sh\nrm -rf /"), None);
        assert_eq!(sniff_image_extension(b""), None);
        assert_eq!(sniff_image_extension(b"%PDF-1.7"), None);
    }
}
