//! Admin notification persistence and real-time push hub.

use serde::Serialize;
use sqlx::PgPool;
use time::OffsetDateTime;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::error::AppError;

const HUB_CAPACITY: usize = 64;

/// JSON payload pushed to admin WebSocket clients.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NotificationEvent {
    New {
        item: NotificationPayload,
        unread: i64,
    },
    Refresh {
        unread: i64,
    },
}

#[derive(Debug, Clone, Serialize)]
pub struct NotificationPayload {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub body: String,
    pub href: Option<String>,
    pub document_slug: Option<String>,
    pub read_at: Option<String>,
    pub created_at: String,
}

/// In-process fan-out for admin notification updates.
#[derive(Clone)]
pub struct NotificationHub {
    tx: broadcast::Sender<NotificationEvent>,
}

impl NotificationHub {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(HUB_CAPACITY);
        Self { tx }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<NotificationEvent> {
        self.tx.subscribe()
    }

    pub fn emit(&self, event: NotificationEvent) {
        let _ = self.tx.send(event);
    }
}

impl Default for NotificationHub {
    fn default() -> Self {
        Self::new()
    }
}

fn row_to_payload(row: &NotificationRow) -> NotificationPayload {
    NotificationPayload {
        id: row.id.to_string(),
        kind: row.kind.clone(),
        title: row.title.clone(),
        body: row.body.clone(),
        href: row.href.clone(),
        document_slug: row.document_slug.clone(),
        read_at: row.read_at.map(|t| t.to_string()),
        created_at: row.created_at.to_string(),
    }
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct NotificationRow {
    pub id: Uuid,
    pub kind: String,
    pub title: String,
    pub body: String,
    pub href: Option<String>,
    pub document_slug: Option<String>,
    pub read_at: Option<OffsetDateTime>,
    pub created_at: OffsetDateTime,
}

pub async fn insert_notification(
    pool: &PgPool,
    hub: &NotificationHub,
    kind: &str,
    title: &str,
    body: &str,
    href: Option<&str>,
    document_slug: Option<&str>,
) -> Result<Uuid, AppError> {
    let id = Uuid::now_v7();
    sqlx::query(
        "insert into notifications (id, kind, title, body, href, document_slug) \
         values ($1, $2, $3, $4, $5, $6)",
    )
    .bind(id)
    .bind(kind)
    .bind(title)
    .bind(body)
    .bind(href)
    .bind(document_slug)
    .execute(pool)
    .await?;

    let row = get_notification(pool, id).await?;
    let unread = count_unread(pool).await?;
    hub.emit(NotificationEvent::New {
        item: row_to_payload(&row),
        unread,
    });

    Ok(id)
}

pub async fn get_notification(pool: &PgPool, id: Uuid) -> Result<NotificationRow, AppError> {
    let row = sqlx::query_as::<_, NotificationRow>(
        "select id, kind, title, body, href, document_slug, read_at, created_at \
         from notifications where id = $1",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn emit_refresh(pool: &PgPool, hub: &NotificationHub) -> Result<(), AppError> {
    let unread = count_unread(pool).await?;
    hub.emit(NotificationEvent::Refresh { unread });
    Ok(())
}

pub async fn list_notifications(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<NotificationRow>, AppError> {
    let rows = sqlx::query_as::<_, NotificationRow>(
        "select id, kind, title, body, href, document_slug, read_at, created_at \
         from notifications \
         order by created_at desc \
         limit $1",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn count_unread(pool: &PgPool) -> Result<i64, AppError> {
    let row: (i64,) = sqlx::query_as("select count(*) from notifications where read_at is null")
        .fetch_one(pool)
        .await?;
    Ok(row.0)
}

pub async fn mark_read(pool: &PgPool, ids: &[Uuid]) -> Result<(), AppError> {
    if ids.is_empty() {
        return Ok(());
    }
    sqlx::query("update notifications set read_at = now() where id = any($1) and read_at is null")
        .bind(ids)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn mark_all_read(pool: &PgPool) -> Result<(), AppError> {
    sqlx::query("update notifications set read_at = now() where read_at is null")
        .execute(pool)
        .await?;
    Ok(())
}
