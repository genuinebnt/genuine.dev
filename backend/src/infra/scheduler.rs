//! Background worker: publish drafts whose `metadata.scheduled_for` is due.

use sqlx::PgPool;

use crate::domain::Kind;
use crate::error::AppError;
use crate::infra::notifications::{NotificationHub, insert_notification};

const TICK_SECS: u64 = 30;

#[derive(sqlx::FromRow)]
struct DueDraft {
    slug: String,
    kind: String,
    title: String,
}

/// Runs on an interval until the process shuts down.
pub fn spawn_scheduled_publish_worker(pool: PgPool, hub: NotificationHub) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(TICK_SECS));
        loop {
            interval.tick().await;
            if let Err(err) = publish_due_scheduled(&pool, &hub).await {
                tracing::warn!("scheduled publish tick failed: {err}");
            }
        }
    });
}

async fn publish_due_scheduled(pool: &PgPool, hub: &NotificationHub) -> Result<(), AppError> {
    let due = sqlx::query_as::<_, DueDraft>(
        "select slug, kind, title from documents \
         where status = 'draft' \
           and metadata ? 'scheduled_for' \
           and (metadata->>'scheduled_for')::timestamptz <= now()",
    )
    .fetch_all(pool)
    .await?;

    for row in due {
        if let Err(err) = publish_one(pool, hub, &row).await {
            tracing::warn!(slug = %row.slug, "scheduled publish failed: {err}");
        }
    }
    Ok(())
}

async fn publish_one(
    pool: &PgPool,
    hub: &NotificationHub,
    draft: &DueDraft,
) -> Result<(), AppError> {
    let updated = sqlx::query(
        "update documents set \
           status = 'published', \
           published_at = coalesce(published_at, now()), \
           metadata = metadata - 'scheduled_for', \
           updated_at = now() \
         where slug = $1 and status = 'draft'",
    )
    .bind(&draft.slug)
    .execute(pool)
    .await?;

    if updated.rows_affected() == 0 {
        return Ok(());
    }

    let href = public_href(&draft.kind, &draft.slug);
    insert_notification(
        pool,
        hub,
        "scheduled_published",
        "Published on schedule",
        &draft.title,
        Some(&href),
        Some(&draft.slug),
    )
    .await?;

    if Kind::parse(&draft.kind) == Some(Kind::Post) {
        crate::infra::subscribers::notify_new_post(pool, &draft.title, &draft.slug).await;
    }

    tracing::info!(slug = %draft.slug, "scheduled document published");
    Ok(())
}

fn public_href(kind: &str, slug: &str) -> String {
    match Kind::parse(kind) {
        Some(Kind::Post) => format!("/blog/{slug}"),
        Some(Kind::Project) => format!("/projects/{slug}"),
        Some(Kind::Page) => match slug {
            "about" => "/about".to_owned(),
            "now" => "/now".to_owned(),
            "uses" => "/uses".to_owned(),
            _ => format!("/{slug}"),
        },
        None => format!("/admin/edit/{slug}"),
    }
}

#[cfg(test)]
mod tests {
    use super::public_href;

    #[test]
    fn public_href_by_kind() {
        assert_eq!(public_href("post", "hello"), "/blog/hello");
        assert_eq!(public_href("project", "notiq"), "/projects/notiq");
        assert_eq!(public_href("page", "about"), "/about");
        assert_eq!(public_href("page", "now"), "/now");
    }
}
