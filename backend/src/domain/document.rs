use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Post,
    Project,
    Page,
}

impl Kind {
    pub fn as_str(&self) -> &'static str {
        match self {
            Kind::Post => "post",
            Kind::Project => "project",
            Kind::Page => "page",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "post" => Some(Kind::Post),
            "project" => Some(Kind::Project),
            "page" => Some(Kind::Page),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Status {
    Draft,
    Published,
}

impl Status {
    pub fn as_str(&self) -> &'static str {
        match self {
            Status::Draft => "draft",
            Status::Published => "published",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "draft" => Some(Status::Draft),
            "published" => Some(Status::Published),
            _ => None,
        }
    }
}

/// A piece of content (post, project, or page). `body_html` is rendered on save.
#[derive(Debug, Clone)]
pub struct Document {
    pub id: Uuid,
    pub slug: String,
    pub kind: Kind,
    pub title: String,
    pub summary: Option<String>,
    pub body_markdown: String,
    pub body_html: String,
    pub reading_min: i32,
    pub status: Status,
    pub published_at: Option<OffsetDateTime>,
}
