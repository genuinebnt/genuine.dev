//! Shared router state: DB pool plus cross-cutting services.

use axum::extract::FromRef;
use sqlx::PgPool;

use crate::infra::notifications::NotificationHub;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub notifications: NotificationHub,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        Self {
            pool,
            notifications: NotificationHub::new(),
        }
    }
}

impl FromRef<AppState> for PgPool {
    fn from_ref(state: &AppState) -> PgPool {
        state.pool.clone()
    }
}

impl FromRef<AppState> for NotificationHub {
    fn from_ref(state: &AppState) -> NotificationHub {
        state.notifications.clone()
    }
}
