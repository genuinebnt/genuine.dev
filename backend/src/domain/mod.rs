//! Pure domain types — entities, value objects, invariants. No I/O.

mod document;
mod slug;

pub use document::{Document, Kind, Status};
pub use slug::Slug;
