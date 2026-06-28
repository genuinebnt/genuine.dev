//! Local-disk implementation of the `StorageBackend` port.
//!
//! Files are written under a configured root and served back at `/uploads/<name>`.
//! Filenames are random (uuid v7) so uploads never collide and the public path
//! leaks nothing about the original file.

use std::path::PathBuf;

use uuid::Uuid;

use crate::app::ports::StorageBackend;
use crate::error::AppError;

pub struct LocalDiskStorage {
    root: PathBuf,
}

impl LocalDiskStorage {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }
}

impl StorageBackend for LocalDiskStorage {
    async fn put(&self, bytes: &[u8], extension: &str) -> Result<String, AppError> {
        let name = format!("{}.{extension}", Uuid::now_v7());
        tokio::fs::create_dir_all(&self.root).await?;
        tokio::fs::write(self.root.join(&name), bytes).await?;
        Ok(format!("/uploads/{name}"))
    }
}
