//! Public content endpoints (posts, projects, pages, search).

use axum::Json;
use axum::extract::{Path, Query, State};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::api::ApiError;
use crate::app::ports::ContentRepository;
use crate::domain::Document;
use crate::infra::repo::PgContentRepository;

#[derive(Serialize)]
pub struct PostItem {
    slug: String,
    title: String,
    summary: Option<String>,
    reading_min: i32,
    date: Option<String>,
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
}

fn item(d: Document) -> PostItem {
    PostItem {
        slug: d.slug,
        title: d.title,
        summary: d.summary,
        reading_min: d.reading_min,
        date: d.published_at.map(|t| t.date().to_string()),
    }
}

fn detail(d: Document) -> PostDetail {
    PostDetail {
        slug: d.slug,
        title: d.title,
        summary: d.summary,
        body_html: d.body_html,
        reading_min: d.reading_min,
        date: d.published_at.map(|t| t.date().to_string()),
        kind: d.kind.as_str().to_owned(),
    }
}

pub async fn list_posts(State(pool): State<PgPool>) -> Result<Json<Vec<PostItem>>, ApiError> {
    let docs = PgContentRepository::new(pool)
        .list_published_posts()
        .await?;
    Ok(Json(docs.into_iter().map(item).collect()))
}

pub async fn list_projects(State(pool): State<PgPool>) -> Result<Json<Vec<PostItem>>, ApiError> {
    let docs = PgContentRepository::new(pool)
        .list_published_by_kind("project")
        .await?;
    Ok(Json(docs.into_iter().map(item).collect()))
}

/// Detail for any published doc by slug (used for posts, projects, pages).
pub async fn get_doc(
    State(pool): State<PgPool>,
    Path(slug): Path<String>,
) -> Result<Json<PostDetail>, ApiError> {
    let doc = PgContentRepository::new(pool)
        .get_published_by_slug(&slug)
        .await?;
    doc.map(|d| Json(detail(d))).ok_or(ApiError::NotFound)
}

#[derive(Deserialize)]
pub struct SearchQ {
    q: String,
}

pub async fn search(
    State(pool): State<PgPool>,
    Query(query): Query<SearchQ>,
) -> Result<Json<Vec<PostItem>>, ApiError> {
    let docs = PgContentRepository::new(pool)
        .search_published(&query.q)
        .await?;
    Ok(Json(docs.into_iter().map(item).collect()))
}
