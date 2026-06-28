//! Dev-only seed: inserts sample content (rendered through the real pipeline) so
//! the site has something to show before the admin editor exists.

use sqlx::PgPool;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::app::ports::{ContentRepository, Renderer};
use crate::domain::{Document, Kind, Slug, Status};
use crate::error::AppError;
use crate::infra::render::MarkdownRenderer;
use crate::infra::repo::PgContentRepository;

pub async fn seed_if_empty(pool: &PgPool) -> Result<(), AppError> {
    let repo = PgContentRepository::new(pool.clone());
    if repo.count().await? > 0 {
        return Ok(());
    }
    let renderer = MarkdownRenderer::new();

    let title = "Writing a lock-free queue from scratch";
    insert(
        &repo,
        &renderer,
        Kind::Post,
        Slug::from_title(title).expect("valid slug").as_str(),
        title,
        Some("The ABA problem, pointer tagging, and CAS — by building it in Rust."),
        POST_MD,
    )
    .await?;

    let project_title = "NotiQ — distributed notification platform";
    insert(
        &repo,
        &renderer,
        Kind::Project,
        "notiq",
        project_title,
        Some("Eight Rust microservices over gRPC and a Postgres-native job queue."),
        PROJECT_MD,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        Kind::Page,
        "about",
        "About",
        Some("Systems engineer, Rustacean, and bug-bounty hunter."),
        ABOUT_MD,
    )
    .await?;

    Ok(())
}

async fn insert(
    repo: &PgContentRepository,
    renderer: &MarkdownRenderer,
    kind: Kind,
    slug: &str,
    title: &str,
    summary: Option<&str>,
    markdown: &str,
) -> Result<(), AppError> {
    let rendered = renderer.render(markdown);
    let doc = Document {
        id: Uuid::now_v7(),
        slug: slug.to_owned(),
        kind,
        title: title.to_owned(),
        summary: summary.map(str::to_owned),
        body_markdown: markdown.to_owned(),
        body_html: rendered.html,
        reading_min: rendered.reading_min,
        status: Status::Published,
        published_at: Some(OffsetDateTime::now_utc()),
    };
    repo.create(&doc).await?;
    tracing::info!("seeded {} '{}'", kind.as_str(), doc.slug);
    Ok(())
}

const POST_MD: &str = r#"# Lock-free queues

A compare-and-swap only checks a pointer's *value*, not its history. That gap is
the **ABA problem** — the reason a naive lock-free stack corrupts under contention.

```rust
loop {
    let head = self.head.load(Ordering::Acquire);
    let next = unsafe { (*head).next }; // danger lives here
    if self.head.compare_exchange(head, next, Acquire, Relaxed).is_ok() {
        break;
    }
}
```

crossbeam attaches a generation counter to each pointer, so a recycled address
with a bumped tag fails the swap — exactly what we want.
"#;

const PROJECT_MD: &str = r#"## NotiQ

A distributed notification platform: eight Rust microservices communicating over
gRPC, backed by a Postgres-native job queue using `SKIP LOCKED`.

- **Membership** — SWIM-style gossip + consistent hashing
- **Delivery** — bulkheaded email / SMS / webhook workers
- **Reliability** — outbox pattern, decorrelated-jitter retries, chaos tests

Built to explore what actually breaks when you operate a reliable delivery system
at scale.
"#;

const ABOUT_MD: &str = r#"## About

Backend & distributed-systems engineer working mostly in **Rust**. I like things
that are fast, correct, and a little over-engineered.

I write about systems programming, distributed systems, and security — and hunt
bugs in my spare time.
"#;
