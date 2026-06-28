//! Newsletter: JSON subscribe + HTML confirm/unsubscribe (clicked from emails).

use axum::Json;
use axum::extract::{Path, State};
use axum::response::Html;
use serde::Deserialize;
use serde_json::{Value, json};
use sqlx::PgPool;

use crate::api::ApiError;
use crate::app::ports::Mailer;

#[derive(Deserialize)]
pub struct SubscribeReq {
    email: String,
}

pub async fn subscribe(
    State(pool): State<PgPool>,
    Json(body): Json<SubscribeReq>,
) -> Result<Json<Value>, ApiError> {
    let email = body.email.trim().to_lowercase();
    if !email.contains('@') || email.len() < 3 {
        return Err(ApiError::BadRequest("enter a valid email".to_owned()));
    }
    let (token, already) = crate::infra::subscribers::subscribe(&pool, &email).await?;
    if already {
        return Ok(Json(json!({ "message": "You're already subscribed." })));
    }
    let link = format!("{}/newsletter/confirm/{token}", crate::config::site_url());
    crate::infra::mailer::LogMailer
        .send(
            &email,
            "Confirm your subscription",
            &format!("Confirm your subscription:\n{link}"),
        )
        .await?;
    Ok(Json(json!({ "message": "Check your email to confirm." })))
}

fn message_page(msg: &str) -> Html<String> {
    Html(format!(
        "<!doctype html><meta charset=utf-8><body style=\"background:#0d0f12;color:#e2e6ee;\
         font-family:monospace;padding:60px;text-align:center\"><p>{msg}</p>\
         <a style=\"color:#00d4a4\" href=\"/\">← home</a></body>"
    ))
}

pub async fn confirm(State(pool): State<PgPool>, Path(token): Path<String>) -> Html<String> {
    let ok = crate::infra::subscribers::confirm(&pool, &token)
        .await
        .unwrap_or(false);
    message_page(if ok {
        "Subscription confirmed — thanks!"
    } else {
        "Invalid or expired link."
    })
}

pub async fn unsubscribe(State(pool): State<PgPool>, Path(token): Path<String>) -> Html<String> {
    let ok = crate::infra::subscribers::unsubscribe(&pool, &token)
        .await
        .unwrap_or(false);
    message_page(if ok {
        "You've been unsubscribed."
    } else {
        "Invalid link."
    })
}
