//! Postgres-backed `ContentRepository` plus comment persistence helpers.

use serde_json::Value as JsonValue;
use sqlx::PgPool;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::app::ports::ContentRepository;
use crate::domain::{Document, Kind, Status};
use crate::error::AppError;

const SELECT_COLS: &str = "id, slug, kind, title, summary, body_markdown, \
     body_html, reading_min, status, cover_image, metadata, published_at";

#[derive(sqlx::FromRow)]
struct DocumentRow {
    id: Uuid,
    slug: String,
    kind: String,
    title: String,
    summary: Option<String>,
    body_markdown: String,
    body_html: String,
    reading_min: i32,
    status: String,
    cover_image: Option<String>,
    metadata: JsonValue,
    published_at: Option<OffsetDateTime>,
}

impl From<DocumentRow> for Document {
    fn from(r: DocumentRow) -> Self {
        Document {
            id: r.id,
            slug: r.slug,
            kind: Kind::parse(&r.kind).unwrap_or(Kind::Post),
            title: r.title,
            summary: r.summary,
            body_markdown: r.body_markdown,
            body_html: r.body_html,
            reading_min: r.reading_min,
            status: Status::parse(&r.status).unwrap_or(Status::Draft),
            cover_image: r.cover_image,
            metadata: r.metadata,
            published_at: r.published_at,
        }
    }
}

pub struct PgContentRepository {
    pool: PgPool,
}

impl PgContentRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl ContentRepository for PgContentRepository {
    async fn create(&self, doc: &Document) -> Result<(), AppError> {
        sqlx::query(
            "insert into documents \
             (id, slug, kind, title, summary, body_markdown, body_html, reading_min, \
              status, cover_image, metadata, published_at) \
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
        )
        .bind(doc.id)
        .bind(&doc.slug)
        .bind(doc.kind.as_str())
        .bind(&doc.title)
        .bind(&doc.summary)
        .bind(&doc.body_markdown)
        .bind(&doc.body_html)
        .bind(doc.reading_min)
        .bind(doc.status.as_str())
        .bind(&doc.cover_image)
        .bind(&doc.metadata)
        .bind(doc.published_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn upsert(&self, doc: &Document) -> Result<(), AppError> {
        sqlx::query(
            "insert into documents \
             (id, slug, kind, title, summary, body_markdown, body_html, reading_min, \
              status, cover_image, metadata, published_at, updated_at) \
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now()) \
             on conflict (slug) do update set \
               kind = excluded.kind, title = excluded.title, summary = excluded.summary, \
               body_markdown = excluded.body_markdown, body_html = excluded.body_html, \
               reading_min = excluded.reading_min, status = excluded.status, \
               cover_image = excluded.cover_image, metadata = excluded.metadata, \
               published_at = case
                 when excluded.status = 'published' then coalesce(documents.published_at, excluded.published_at, now())
                 else null
               end, \
               updated_at = now()",
        )
        .bind(doc.id)
        .bind(&doc.slug)
        .bind(doc.kind.as_str())
        .bind(&doc.title)
        .bind(&doc.summary)
        .bind(&doc.body_markdown)
        .bind(&doc.body_html)
        .bind(doc.reading_min)
        .bind(doc.status.as_str())
        .bind(&doc.cover_image)
        .bind(&doc.metadata)
        .bind(doc.published_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn delete(&self, slug: &str) -> Result<(), AppError> {
        sqlx::query("delete from documents where slug = $1")
            .bind(slug)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn list_all(&self) -> Result<Vec<Document>, AppError> {
        let rows = sqlx::query_as::<_, DocumentRow>(&format!(
            "select {SELECT_COLS} from documents order by updated_at desc"
        ))
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Document::from).collect())
    }

    async fn get_by_slug(&self, slug: &str) -> Result<Option<Document>, AppError> {
        let row = sqlx::query_as::<_, DocumentRow>(&format!(
            "select {SELECT_COLS} from documents where slug = $1"
        ))
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(Document::from))
    }

    async fn get_published_by_slug(&self, slug: &str) -> Result<Option<Document>, AppError> {
        let row = sqlx::query_as::<_, DocumentRow>(&format!(
            "select {SELECT_COLS} from documents where slug = $1 and status = 'published'"
        ))
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(Document::from))
    }

    async fn list_published_posts(&self) -> Result<Vec<Document>, AppError> {
        let rows = sqlx::query_as::<_, DocumentRow>(&format!(
            "select {SELECT_COLS} from documents \
             where status = 'published' and kind = 'post' \
             order by published_at desc nulls last"
        ))
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Document::from).collect())
    }

    async fn list_published_by_kind(&self, kind: &str) -> Result<Vec<Document>, AppError> {
        let rows = sqlx::query_as::<_, DocumentRow>(&format!(
            "select {SELECT_COLS} from documents \
             where status = 'published' and kind = $1 \
             order by published_at desc nulls last"
        ))
        .bind(kind)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Document::from).collect())
    }

    async fn search_published(&self, query: &str) -> Result<Vec<Document>, AppError> {
        let rows = sqlx::query_as::<_, DocumentRow>(&format!(
            "select {SELECT_COLS} from documents \
             where status = 'published' \
             and search_tsv @@ plainto_tsquery('english', $1) \
             order by ts_rank(search_tsv, plainto_tsquery('english', $1)) desc \
             limit 20"
        ))
        .bind(query)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(Document::from).collect())
    }

    async fn count(&self) -> Result<i64, AppError> {
        let (n,): (i64,) = sqlx::query_as("select count(*) from documents")
            .fetch_one(&self.pool)
            .await?;
        Ok(n)
    }
}

// ── Adjacent post helpers — not on the port trait (single-use, no second impl planned) ──

#[derive(sqlx::FromRow)]
pub struct AdjacentPost {
    pub slug: String,
    pub title: String,
}

/// Returns (prev, next) published posts adjacent by date to the given slug.
/// `prev` is the most recently published post before this one; `next` is the
/// oldest published post after this one. Both are `None` if there is no neighbour.
pub async fn get_adjacent_posts(
    pool: &PgPool,
    slug: &str,
) -> Result<(Option<AdjacentPost>, Option<AdjacentPost>), AppError> {
    let prev = sqlx::query_as::<_, AdjacentPost>(
        "select slug, title from documents \
         where status = 'published' and kind = 'post' \
           and published_at < (select published_at from documents where slug = $1 and status = 'published') \
         order by published_at desc limit 1",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;

    let next = sqlx::query_as::<_, AdjacentPost>(
        "select slug, title from documents \
         where status = 'published' and kind = 'post' \
           and published_at > (select published_at from documents where slug = $1 and status = 'published') \
         order by published_at asc limit 1",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;

    Ok((prev, next))
}

/// Up to four published posts sharing at least one tag with the given slug.
pub async fn get_related_posts(
    pool: &PgPool,
    slug: &str,
    limit: i64,
) -> Result<Vec<AdjacentPost>, AppError> {
    let rows = sqlx::query_as::<_, AdjacentPost>(
        "select d.slug, d.title from documents d \
         where d.status = 'published' and d.kind = 'post' and d.slug != $1 \
           and exists ( \
             select 1 from jsonb_array_elements_text(d.metadata->'tags') dt(tag) \
             where dt.tag in ( \
               select jsonb_array_elements_text(coalesce(src.metadata->'tags', '[]'::jsonb)) \
               from documents src where src.slug = $1 \
             ) \
           ) \
         order by d.published_at desc nulls last \
         limit $2",
    )
    .bind(slug)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

/// Previous/next posts in the same series (by metadata.series.name + part).
pub async fn get_series_neighbors(
    pool: &PgPool,
    slug: &str,
) -> Result<(Option<AdjacentPost>, Option<AdjacentPost>), AppError> {
    let prev = sqlx::query_as::<_, AdjacentPost>(
        "select d.slug, d.title from documents d \
         join documents cur on cur.slug = $1 \
         where d.status = 'published' and d.kind = 'post' \
           and d.metadata->'series'->>'name' = cur.metadata->'series'->>'name' \
           and (d.metadata->'series'->>'part')::int < (cur.metadata->'series'->>'part')::int \
         order by (d.metadata->'series'->>'part')::int desc limit 1",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;

    let next = sqlx::query_as::<_, AdjacentPost>(
        "select d.slug, d.title from documents d \
         join documents cur on cur.slug = $1 \
         where d.status = 'published' and d.kind = 'post' \
           and d.metadata->'series'->>'name' = cur.metadata->'series'->>'name' \
           and (d.metadata->'series'->>'part')::int > (cur.metadata->'series'->>'part')::int \
         order by (d.metadata->'series'->>'part')::int asc limit 1",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;

    Ok((prev, next))
}

// ── Comment helpers (not on the port trait — simple CRUD, no abstraction needed yet) ──

pub struct Comment {
    pub id: Uuid,
    pub name: String,
    pub body: String,
    pub created_at: OffsetDateTime,
}

#[derive(sqlx::FromRow)]
struct CommentRow {
    id: Uuid,
    name: String,
    body: String,
    created_at: OffsetDateTime,
}

impl From<CommentRow> for Comment {
    fn from(r: CommentRow) -> Self {
        Comment {
            id: r.id,
            name: r.name,
            body: r.body,
            created_at: r.created_at,
        }
    }
}

pub async fn list_comments(pool: &PgPool, document_id: Uuid) -> Result<Vec<Comment>, AppError> {
    let rows = sqlx::query_as::<_, CommentRow>(
        "select id, name, body, created_at from comments \
         where document_id = $1 order by created_at asc",
    )
    .bind(document_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(Comment::from).collect())
}

pub async fn insert_comment(
    pool: &PgPool,
    document_id: Uuid,
    name: &str,
    body: &str,
) -> Result<Comment, AppError> {
    let id = Uuid::now_v7();
    let now = OffsetDateTime::now_utc();
    sqlx::query(
        "insert into comments (id, document_id, name, body, created_at) \
         values ($1, $2, $3, $4, $5)",
    )
    .bind(id)
    .bind(document_id)
    .bind(name)
    .bind(body)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(Comment {
        id,
        name: name.to_owned(),
        body: body.to_owned(),
        created_at: now,
    })
}
