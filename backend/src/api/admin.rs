//! Admin content CRUD (JWT-guarded via the `AuthUser` extractor).

use axum::Json;
use axum::extract::{Multipart, Path, State};
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::api::ApiError;
use crate::api::auth::AuthUser;
use crate::app::ports::{ContentRepository, Renderer, StorageBackend};
use crate::domain::{Document, Kind, Slug, Status};
use crate::infra::render::MarkdownRenderer;
use crate::infra::repo::{self, PgContentRepository};
use crate::infra::storage::LocalDiskStorage;

#[derive(Serialize)]
pub struct AdminItem {
    slug: String,
    title: String,
    kind: String,
    status: String,
    published_at: Option<String>,
    metadata: serde_json::Value,
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
                published_at: d.published_at.map(|t| t.date().to_string()),
                metadata: d.metadata,
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

#[derive(Serialize)]
pub struct SaveOut {
    slug: String,
}

#[derive(Deserialize)]
pub struct PreviewReq {
    body: String,
}

#[derive(Serialize)]
pub struct PreviewOut {
    html: String,
}

/// Renders markdown through the same pipeline as publish — preview parity for the admin editor.
pub async fn preview(
    _user: AuthUser,
    Json(req): Json<PreviewReq>,
) -> Result<Json<PreviewOut>, ApiError> {
    let rendered = MarkdownRenderer::new().render(&req.body);
    Ok(Json(PreviewOut {
        html: rendered.html,
    }))
}

pub async fn save(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Json(req): Json<SaveReq>,
) -> Result<Json<SaveOut>, ApiError> {
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
        published_at: match status {
            Status::Published => Some(time::OffsetDateTime::now_utc()),
            Status::Draft => None,
        },
    };

    PgContentRepository::new(pool.clone()).upsert(&doc).await?;

    // Snapshot the saved state into the revision history. A revision failing to
    // write must not fail the save itself.
    let snapshot = repo::RevisionSnapshot {
        title: &doc.title,
        summary: doc.summary.as_deref(),
        body_markdown: &doc.body_markdown,
        cover_image: doc.cover_image.as_deref(),
        status: doc.status.as_str(),
        metadata: &doc.metadata,
    };
    if let Err(err) = repo::insert_revision(&pool, &doc.slug, &snapshot).await {
        tracing::warn!(error = %err, slug = %doc.slug, "failed to snapshot revision");
    }

    if matches!(doc.status, Status::Published) {
        crate::infra::subscribers::notify_new_post(&pool, &doc.title, &doc.slug).await;
    }
    Ok(Json(SaveOut { slug: doc.slug }))
}

// ── Revision history ────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct RevisionItem {
    id: Uuid,
    title: String,
    status: String,
    /// Unix seconds — the frontend renders relative + absolute time.
    created_at: i64,
}

#[derive(Serialize)]
pub struct RevisionDetail {
    id: Uuid,
    title: String,
    summary: Option<String>,
    body_markdown: String,
    cover_image: Option<String>,
    status: String,
    metadata: serde_json::Value,
    created_at: i64,
}

pub async fn list_revisions(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<Vec<RevisionItem>>, ApiError> {
    let revisions = repo::list_revisions(&pool, &slug).await?;
    Ok(Json(
        revisions
            .into_iter()
            .map(|r| RevisionItem {
                id: r.id,
                title: r.title,
                status: r.status,
                created_at: r.created_at.unix_timestamp(),
            })
            .collect(),
    ))
}

pub async fn get_revision(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Path((slug, revision_id)): Path<(String, Uuid)>,
) -> Result<Json<RevisionDetail>, ApiError> {
    let revision = repo::get_revision(&pool, &slug, revision_id)
        .await?
        .ok_or(ApiError::NotFound)?;
    Ok(Json(RevisionDetail {
        id: revision.id,
        title: revision.title,
        summary: revision.summary,
        body_markdown: revision.body_markdown,
        cover_image: revision.cover_image,
        status: revision.status,
        metadata: revision.metadata,
        created_at: revision.created_at.unix_timestamp(),
    }))
}

pub async fn delete(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<StatusCode, ApiError> {
    PgContentRepository::new(pool).delete(&slug).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// Clone a document as a new draft with a unique `-copy` slug.
pub async fn duplicate(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<SaveOut>, ApiError> {
    let repo = PgContentRepository::new(pool.clone());
    let source = repo.get_by_slug(&slug).await?.ok_or(ApiError::NotFound)?;

    let base = format!("{}-copy", source.slug);
    let mut candidate = base.clone();
    let mut n = 2u32;
    while repo.get_by_slug(&candidate).await?.is_some() {
        candidate = format!("{base}-{n}");
        n += 1;
    }

    let rendered = MarkdownRenderer::new().render(&source.body_markdown);
    let doc = Document {
        id: uuid::Uuid::now_v7(),
        slug: candidate.clone(),
        kind: source.kind,
        title: format!("{} (copy)", source.title),
        summary: source.summary,
        body_markdown: source.body_markdown,
        body_html: rendered.html,
        reading_min: rendered.reading_min,
        status: Status::Draft,
        cover_image: source.cover_image,
        metadata: source.metadata,
        published_at: None,
    };

    repo.upsert(&doc).await?;
    Ok(Json(SaveOut { slug: candidate }))
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
