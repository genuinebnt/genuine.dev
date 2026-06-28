//! Ports — the seams where implementations are swapped (storage, rendering).

use crate::domain::Document;
use crate::error::AppError;

/// Output of rendering markdown.
pub struct Rendered {
    pub html: String,
    pub reading_min: i32,
}

/// Renders markdown to HTML. The registry of rich blocks/directives grows here.
pub trait Renderer: Send + Sync {
    fn render(&self, markdown: &str) -> Rendered;
}

/// Sends transactional email. Dev uses a logging impl; prod swaps a provider.
#[allow(async_fn_in_trait)]
pub trait Mailer: Send + Sync {
    async fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), AppError>;
}

/// Stores uploaded binary assets (images). Local disk now; object storage later.
#[allow(async_fn_in_trait)]
pub trait StorageBackend: Send + Sync {
    /// Persist `bytes` and return the public URL path (e.g. `/uploads/<name>.<ext>`).
    async fn put(&self, bytes: &[u8], extension: &str) -> Result<String, AppError>;
}

/// Persistence for content. Swappable (read replica / cache) behind this port.
/// `async fn` in trait is intentional — this is an internal port (static dispatch).
#[allow(async_fn_in_trait)]
pub trait ContentRepository {
    async fn create(&self, doc: &Document) -> Result<(), AppError>;
    /// Insert or update by slug (admin save). Preserves an existing `published_at`.
    async fn upsert(&self, doc: &Document) -> Result<(), AppError>;
    async fn delete(&self, slug: &str) -> Result<(), AppError>;
    /// All documents incl. drafts (admin dashboard).
    async fn list_all(&self) -> Result<Vec<Document>, AppError>;
    /// By slug, any status (admin edit — drafts included).
    async fn get_by_slug(&self, slug: &str) -> Result<Option<Document>, AppError>;
    async fn get_published_by_slug(&self, slug: &str) -> Result<Option<Document>, AppError>;
    async fn list_published_posts(&self) -> Result<Vec<Document>, AppError>;
    async fn list_published_by_kind(&self, kind: &str) -> Result<Vec<Document>, AppError>;
    async fn search_published(&self, query: &str) -> Result<Vec<Document>, AppError>;
    async fn count(&self) -> Result<i64, AppError>;
}
