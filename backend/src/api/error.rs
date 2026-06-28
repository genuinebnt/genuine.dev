//! Web-layer error. Maps to an HTTP status + JSON body. Domain/infra `AppError`
//! converts into `ApiError::Internal` (logged) via `?`, so handlers stay terse.

use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

use crate::error::AppError;

#[derive(Debug)]
pub enum ApiError {
    NotFound,
    Unauthorized,
    BadRequest(String),
    Internal,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, "not found".to_owned()),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized".to_owned()),
            ApiError::BadRequest(m) => (StatusCode::BAD_REQUEST, m),
            ApiError::Internal => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "internal error".to_owned(),
            ),
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<AppError> for ApiError {
    fn from(err: AppError) -> Self {
        tracing::error!(error = %err, "internal error");
        ApiError::Internal
    }
}
