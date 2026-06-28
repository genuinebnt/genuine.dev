//! Admin notification feed (JWT-guarded) and WebSocket push.

use axum::Json;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::api::ApiError;
use crate::api::auth::{AuthUser, user_id_from_token};
use crate::infra::notifications::{
    NotificationEvent, NotificationHub, NotificationRow, count_unread, emit_refresh,
    list_notifications, mark_all_read, mark_read,
};

#[derive(Serialize)]
pub struct NotificationOut {
    id: String,
    kind: String,
    title: String,
    body: String,
    href: Option<String>,
    document_slug: Option<String>,
    read_at: Option<String>,
    created_at: String,
}

#[derive(Serialize)]
pub struct NotificationListOut {
    items: Vec<NotificationOut>,
    unread: i64,
}

#[derive(Deserialize)]
pub struct ListQuery {
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_limit() -> i64 {
    20
}

#[derive(Deserialize)]
pub struct MarkReadReq {
    ids: Vec<String>,
}

#[derive(Deserialize)]
pub struct WsQuery {
    token: String,
}

fn map_row(row: NotificationRow) -> NotificationOut {
    NotificationOut {
        id: row.id.to_string(),
        kind: row.kind,
        title: row.title,
        body: row.body,
        href: row.href,
        document_slug: row.document_slug,
        read_at: row.read_at.map(|t| t.to_string()),
        created_at: row.created_at.to_string(),
    }
}

pub async fn list(
    _user: AuthUser,
    State(pool): State<PgPool>,
    Query(query): Query<ListQuery>,
) -> Result<Json<NotificationListOut>, ApiError> {
    let limit = query.limit.clamp(1, 50);
    let items = list_notifications(&pool, limit).await?;
    let unread = count_unread(&pool).await?;
    Ok(Json(NotificationListOut {
        items: items.into_iter().map(map_row).collect(),
        unread,
    }))
}

pub async fn mark_read_handler(
    _user: AuthUser,
    State(pool): State<PgPool>,
    State(hub): State<NotificationHub>,
    Json(req): Json<MarkReadReq>,
) -> Result<StatusCode, ApiError> {
    let ids: Vec<Uuid> = req
        .ids
        .iter()
        .filter_map(|id| Uuid::parse_str(id).ok())
        .collect();
    mark_read(&pool, &ids).await?;
    emit_refresh(&pool, &hub).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn mark_all_read_handler(
    _user: AuthUser,
    State(pool): State<PgPool>,
    State(hub): State<NotificationHub>,
) -> Result<StatusCode, ApiError> {
    mark_all_read(&pool).await?;
    emit_refresh(&pool, &hub).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn ws(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(hub): State<NotificationHub>,
) -> Result<impl IntoResponse, ApiError> {
    if user_id_from_token(&query.token).is_none() {
        return Err(ApiError::Unauthorized);
    }
    let rx = hub.subscribe();
    Ok(ws.on_upgrade(move |socket| handle_ws(socket, rx)))
}

async fn handle_ws(mut socket: WebSocket, mut rx: broadcast::Receiver<NotificationEvent>) {
    loop {
        tokio::select! {
            event = rx.recv() => {
                match event {
                    Ok(event) => {
                        let Ok(json) = serde_json::to_string(&event) else { break };
                        if socket.send(Message::Text(json.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
            incoming = socket.recv() => {
                match incoming {
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Ok(Message::Ping(payload))) => {
                        if socket.send(Message::Pong(payload)).await.is_err() {
                            break;
                        }
                    }
                    Some(Ok(_)) => {}
                    Some(Err(_)) => break,
                }
            }
        }
    }
}
