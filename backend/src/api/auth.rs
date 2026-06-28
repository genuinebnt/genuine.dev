//! JWT auth: login issues a token; `AuthUser` extractor guards admin routes.

use axum::Json;
use axum::extract::{FromRequestParts, State};
use axum::http::request::Parts;
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::api::ApiError;

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

fn secret() -> String {
    std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-insecure-secret-change-me".to_owned())
}

pub fn encode_jwt(user_id: Uuid) -> Result<String, jsonwebtoken::errors::Error> {
    let exp = (time::OffsetDateTime::now_utc() + time::Duration::days(7)).unix_timestamp() as usize;
    let claims = Claims {
        sub: user_id.to_string(),
        exp,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret().as_bytes()),
    )
}

fn decode_jwt(token: &str) -> Option<Uuid> {
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret().as_bytes()),
        &Validation::default(),
    )
    .ok()?;
    Uuid::parse_str(&data.claims.sub).ok()
}

/// Validates a raw JWT string (query param or Bearer prefix stripped by caller).
pub fn user_id_from_token(token: &str) -> Option<Uuid> {
    decode_jwt(token)
}

/// Extractor that requires a valid `Authorization: Bearer <jwt>`.
pub struct AuthUser {
    #[allow(dead_code)]
    pub user_id: Uuid,
}

impl<S: Send + Sync> FromRequestParts<S> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, ApiError> {
        let token = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
            .ok_or(ApiError::Unauthorized)?;
        let user_id = decode_jwt(token).ok_or(ApiError::Unauthorized)?;
        Ok(AuthUser { user_id })
    }
}

#[derive(Deserialize)]
pub struct LoginReq {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct TokenResp {
    pub token: String,
}

pub async fn login(
    State(pool): State<PgPool>,
    Json(body): Json<LoginReq>,
) -> Result<Json<TokenResp>, ApiError> {
    let creds = crate::infra::auth::find_credentials(&pool, &body.username).await?;
    let (id, hash) = creds.ok_or(ApiError::Unauthorized)?;
    if !crate::infra::auth::verify_password(&body.password, &hash) {
        return Err(ApiError::Unauthorized);
    }
    let token = encode_jwt(id).map_err(|_| ApiError::Internal)?;
    Ok(Json(TokenResp { token }))
}

pub async fn me(user: AuthUser) -> Json<serde_json::Value> {
    Json(serde_json::json!({ "user_id": user.user_id.to_string() }))
}
