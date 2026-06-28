//! Postgres-backed `ContentRepository`.

use sqlx::PgPool;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::app::ports::ContentRepository;
use crate::domain::{Document, Kind, Status};
use crate::error::AppError;

const SELECT_COLS: &str = "id, slug, kind, title, summary, body_markdown, \
     body_html, reading_min, status, published_at";

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
             (id, slug, kind, title, summary, body_markdown, body_html, reading_min, status, published_at) \
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
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
        .bind(doc.published_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn upsert(&self, doc: &Document) -> Result<(), AppError> {
        sqlx::query(
            "insert into documents \
             (id, slug, kind, title, summary, body_markdown, body_html, reading_min, status, published_at, updated_at) \
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now()) \
             on conflict (slug) do update set \
               kind = excluded.kind, title = excluded.title, summary = excluded.summary, \
               body_markdown = excluded.body_markdown, body_html = excluded.body_html, \
               reading_min = excluded.reading_min, status = excluded.status, \
               published_at = coalesce(documents.published_at, excluded.published_at), \
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
