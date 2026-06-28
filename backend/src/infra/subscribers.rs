//! Newsletter subscriber persistence (double opt-in).

use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

pub struct Subscriber {
    pub email: String,
    pub token: String,
}

/// Records a pending subscriber (or returns the existing one). Returns the
/// confirm token and whether they're already confirmed.
pub async fn subscribe(pool: &PgPool, email: &str) -> Result<(String, bool), AppError> {
    let token = Uuid::now_v7().to_string();
    sqlx::query(
        "insert into subscribers (id, email, status, token) values ($1, $2, 'pending', $3) \
         on conflict (email) do nothing",
    )
    .bind(Uuid::now_v7())
    .bind(email)
    .bind(&token)
    .execute(pool)
    .await?;

    let (tok, status): (String, String) =
        sqlx::query_as("select token, status from subscribers where email = $1")
            .bind(email)
            .fetch_one(pool)
            .await?;
    Ok((tok, status == "confirmed"))
}

/// Confirms a pending subscription. Returns true if a row was updated.
pub async fn confirm(pool: &PgPool, token: &str) -> Result<bool, AppError> {
    let res = sqlx::query(
        "update subscribers set status = 'confirmed', confirmed_at = now() \
         where token = $1 and status = 'pending'",
    )
    .bind(token)
    .execute(pool)
    .await?;
    Ok(res.rows_affected() > 0)
}

pub async fn unsubscribe(pool: &PgPool, token: &str) -> Result<bool, AppError> {
    let res = sqlx::query("update subscribers set status = 'unsubscribed' where token = $1")
        .bind(token)
        .execute(pool)
        .await?;
    Ok(res.rows_affected() > 0)
}

pub async fn list_confirmed(pool: &PgPool) -> Result<Vec<Subscriber>, AppError> {
    let rows = sqlx::query_as::<_, (String, String)>(
        "select email, token from subscribers where status = 'confirmed'",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(email, token)| Subscriber { email, token })
        .collect())
}

/// Emails confirmed subscribers about a newly published post (dev: logs it).
pub async fn notify_new_post(pool: &PgPool, title: &str, slug: &str) {
    use crate::app::ports::Mailer;
    let base = crate::config::site_url();
    let subs = list_confirmed(pool).await.unwrap_or_default();
    for s in subs {
        let body = format!(
            "New post: {title}\n{base}/blog/{slug}\n\nUnsubscribe: {base}/newsletter/unsubscribe/{}",
            s.token
        );
        let _ = crate::infra::mailer::LogMailer
            .send(&s.email, &format!("New post: {title}"), &body)
            .await;
    }
}
