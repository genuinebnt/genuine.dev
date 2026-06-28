//! Public content endpoints (posts, projects, pages, search, comments).

use axum::Json;
use axum::extract::{Path, Query, State};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::PgPool;
use uuid::Uuid;

use crate::api::ApiError;
use crate::app::ports::ContentRepository;
use crate::domain::Document;
use crate::infra::repo::{self, AdjacentPost, PgContentRepository};

fn content_repo(pool: &PgPool) -> PgContentRepository {
    PgContentRepository::new(pool.clone())
}

async fn published_doc(pool: &PgPool, slug: &str) -> Result<Document, ApiError> {
    content_repo(pool)
        .get_published_by_slug(slug)
        .await?
        .ok_or(ApiError::NotFound)
}

#[derive(Serialize)]
pub struct PostItem {
    slug: String,
    title: String,
    summary: Option<String>,
    reading_min: i32,
    date: Option<String>,
    metadata: JsonValue,
}

#[derive(Serialize)]
pub struct PostNavItem {
    slug: String,
    title: String,
}

impl From<AdjacentPost> for PostNavItem {
    fn from(a: AdjacentPost) -> Self {
        PostNavItem { slug: a.slug, title: a.title }
    }
}

#[derive(Serialize)]
pub struct PostDetail {
    slug: String,
    title: String,
    summary: Option<String>,
    body_html: String,
    reading_min: i32,
    date: Option<String>,
    kind: String,
    cover_image: Option<String>,
    metadata: JsonValue,
    prev: Option<PostNavItem>,
    next: Option<PostNavItem>,
}

fn item(d: Document) -> PostItem {
    PostItem {
        slug: d.slug,
        title: d.title,
        summary: d.summary,
        reading_min: d.reading_min,
        date: d.published_at.map(|t| t.date().to_string()),
        metadata: d.metadata,
    }
}

fn detail(d: Document, prev: Option<AdjacentPost>, next: Option<AdjacentPost>) -> PostDetail {
    PostDetail {
        slug: d.slug.clone(),
        title: d.title,
        summary: d.summary,
        body_html: d.body_html,
        reading_min: d.reading_min,
        date: d.published_at.map(|t| t.date().to_string()),
        kind: d.kind.as_str().to_owned(),
        cover_image: d.cover_image,
        metadata: d.metadata,
        prev: prev.map(PostNavItem::from),
        next: next.map(PostNavItem::from),
    }
}

pub async fn list_posts(State(pool): State<PgPool>) -> Result<Json<Vec<PostItem>>, ApiError> {
    let docs = content_repo(&pool).list_published_posts().await?;
    Ok(Json(docs.into_iter().map(item).collect()))
}

pub async fn list_projects(State(pool): State<PgPool>) -> Result<Json<Vec<PostItem>>, ApiError> {
    let docs = content_repo(&pool)
        .list_published_by_kind("project")
        .await?;
    Ok(Json(docs.into_iter().map(item).collect()))
}

/// Detail for any published doc by slug (posts, projects, pages).
pub async fn get_doc(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<PostDetail>, ApiError> {
    let doc = published_doc(&pool, &slug).await?;

    // Adjacent navigation is only meaningful for posts.
    let (prev, next) = if doc.kind == crate::domain::Kind::Post {
        repo::get_adjacent_posts(&pool, &slug).await?
    } else {
        (None, None)
    };

    Ok(Json(detail(doc, prev, next)))
}

#[derive(Deserialize)]
pub struct SearchQ {
    q: String,
}

pub async fn search(
    State(pool): State<PgPool>,
    Query(query): Query<SearchQ>,
) -> Result<Json<Vec<PostItem>>, ApiError> {
    let docs = content_repo(&pool).search_published(&query.q).await?;
    Ok(Json(docs.into_iter().map(item).collect()))
}

// ── Comments ──────────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct CommentOut {
    id: Uuid,
    name: String,
    body: String,
    date: String,
}

#[derive(Deserialize)]
pub struct CommentIn {
    name: String,
    body: String,
}

pub async fn list_comments(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<Vec<CommentOut>>, ApiError> {
    let doc = published_doc(&pool, &slug).await?;

    let comments = repo::list_comments(&pool, doc.id).await?;
    let out = comments
        .into_iter()
        .map(|c| CommentOut {
            id: c.id,
            name: c.name,
            body: c.body,
            date: c.created_at.date().to_string(),
        })
        .collect();
    Ok(Json(out))
}

pub async fn create_comment(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
    Json(body): Json<CommentIn>,
) -> Result<Json<CommentOut>, ApiError> {
    // Basic validation — keep it simple, no auth required.
    if body.name.trim().is_empty() || body.body.trim().is_empty() {
        return Err(ApiError::BadRequest("name and body are required".into()));
    }
    if body.name.len() > 80 || body.body.len() > 4000 {
        return Err(ApiError::BadRequest("name or body too long".into()));
    }

    let doc = published_doc(&pool, &slug).await?;

    let comment = repo::insert_comment(&pool, doc.id, body.name.trim(), body.body.trim()).await?;
    Ok(Json(CommentOut {
        id: comment.id,
        name: comment.name,
        body: comment.body,
        date: comment.created_at.date().to_string(),
    }))
}
