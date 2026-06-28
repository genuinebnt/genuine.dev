//! Dev-only seed: inserts rich sample content rendered through the real pipeline.
//! Demonstrates every custom directive so the site has styled content to show
//! before the admin editor is used. The NotiQ project recreates
//! `docs/notiq_portfolio.html` using the `:::` directive library.

use serde_json::json;
use sqlx::PgPool;
use time::{Duration, OffsetDateTime};
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
    run_seed(pool, SeedMode::Create).await
}

/// Inserts any seed document whose slug is not already in the database.
pub async fn seed_missing(pool: &PgPool) -> Result<(), AppError> {
    run_seed(pool, SeedMode::SkipExisting).await
}

/// Re-renders and upserts every seed document (dev refresh after seed content changes).
pub async fn seed_refresh(pool: &PgPool) -> Result<(), AppError> {
    run_seed(pool, SeedMode::Upsert).await
}

#[derive(Clone, Copy)]
enum SeedMode {
    /// Used when the database is empty — always insert.
    Create,
    /// Skip slugs that already exist.
    SkipExisting,
    /// Upsert all seed slugs; preserves id + published_at on existing rows.
    Upsert,
}

async fn run_seed(pool: &PgPool, mode: SeedMode) -> Result<(), AppError> {
    let repo = PgContentRepository::new(pool.clone());
    let renderer = MarkdownRenderer::new();
    let skip_existing = matches!(mode, SeedMode::SkipExisting);

    // ── Blog posts (newest first via `days_ago`) ──────────────────────────────
    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "writing-a-lock-free-queue-from-scratch",
        "Writing a lock-free queue from scratch",
        Some("The ABA problem, pointer tagging, and CAS — by building it in Rust."),
        LOCKFREE_PART1_MD,
        json!({
            "featured": true,
            "topic": "rust",
            "series": { "name": "Lock-free data structures in Rust", "part": 1 },
            "tags": ["rust", "concurrency"]
        }),
        2,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "reclaiming-memory-hazard-pointers-vs-epochs",
        "Reclaiming memory: hazard pointers vs epochs",
        Some("Once the queue works, the hard part begins — freeing nodes safely."),
        LOCKFREE_PART2_MD,
        json!({
            "featured": true,
            "topic": "rust",
            "series": { "name": "Lock-free data structures in Rust", "part": 2 },
            "tags": ["rust", "concurrency"]
        }),
        9,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "ssrf-to-internal-dashboards",
        "SSRF to internal dashboards: a bug-bounty walkthrough",
        Some("How a forgotten URL preview endpoint exposed an entire metadata service."),
        SSRF_MD,
        json!({ "featured": true, "topic": "infosec", "tags": ["security", "bug-bounty"] }),
        18,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "what-skip-locked-actually-does",
        "What SKIP LOCKED actually does",
        Some("A Postgres-native job queue in 30 lines, and why it doesn't block."),
        SKIP_LOCKED_MD,
        json!({ "topic": "systems", "tags": ["postgres", "systems"] }),
        33,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "consistent-hashing-virtual-nodes",
        "Consistent hashing without the magic",
        Some("Why 150 virtual nodes per worker is a heuristic, not a religion."),
        CONSISTENT_HASH_MD,
        json!({
            "topic": "distributed",
            "tags": ["distributed-systems", "hashing"]
        }),
        5,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "reading-postgres-explain-analyze",
        "Reading Postgres EXPLAIN (ANALYZE, BUFFERS)",
        Some("Seq scans aren't always evil — learn what the planner is actually telling you."),
        EXPLAIN_MD,
        json!({ "topic": "systems", "tags": ["postgres", "performance"] }),
        12,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "idor-via-predictable-ids",
        "IDOR via predictable IDs: a logic bug dressed as auth",
        Some("When UUIDs in the URL aren't secret — and the API never checks ownership."),
        IDOR_MD,
        json!({ "topic": "infosec", "tags": ["security", "bug-bounty", "web"] }),
        21,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "tokio-cooperative-scheduling",
        "Tokio's cooperative scheduler: budgets, yields, and starvation",
        Some("Async Rust isn't preemptive — long polls block everyone on the same worker."),
        TOKIO_SCHED_MD,
        json!({ "topic": "rust", "tags": ["rust", "async", "tokio"] }),
        27,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "raft-leader-election-walkthrough",
        "Raft leader election, step by step",
        Some("Terms, votes, and why split votes aren't a bug — they're the protocol working."),
        RAFT_MD,
        json!({
            "topic": "distributed",
            "tags": ["consensus", "distributed-systems"]
        }),
        45,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "rust-pin-and-self-referential-structs",
        "Pin and self-referential structs in Rust",
        Some("Why `Pin<&mut T>` exists, and when your future really needs it."),
        PIN_MD,
        json!({ "topic": "rust", "tags": ["rust", "async"] }),
        52,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "bpf-kprobes-for-latency-tracing",
        "BPF kprobes for latency tracing",
        Some("Attach to kernel entry points without recompiling — and know when to stop."),
        BPF_MD,
        json!({ "topic": "systems", "tags": ["linux", "observability"] }),
        60,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "swim-gossip-membership-basics",
        "SWIM gossip membership in plain language",
        Some("Failure detectors without a central heartbeat server — and the false-positive knob."),
        SWIM_MD,
        json!({
            "topic": "distributed",
            "tags": ["distributed-systems", "gossip"]
        }),
        72,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "logic-bugs-in-checkout-flows",
        "Logic bugs in checkout flows",
        Some("When the price is right in the UI but wrong in the API — and how hunters find it."),
        CHECKOUT_MD,
        json!({ "topic": "infosec", "tags": ["security", "web", "bug-bounty"] }),
        85,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "memory-ordering-in-practice",
        "Memory ordering in practice (not the spec)",
        Some("Acquire, release, and when Relaxed is actually fine on hot paths."),
        MEMORY_ORDER_MD,
        json!({
            "topic": "rust",
            "tags": ["rust", "concurrency"],
            "series": { "name": "Lock-free data structures in Rust", "part": 3 }
        }),
        95,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Post,
        "postgres-connection-pooling-pitfalls",
        "Postgres connection pooling pitfalls",
        Some("Prepared statements, transaction pooling, and the errors that only show under load."),
        POOLING_MD,
        json!({ "topic": "systems", "tags": ["postgres", "systems"] }),
        105,
    )
    .await?;

    // ── Projects ──────────────────────────────────────────────────────────────
    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Project,
        "notiq",
        "NotiQ — distributed notification platform",
        Some("Eight Rust microservices over gRPC and a Postgres-native job queue."),
        NOTIQ_MD,
        json!({
            "featured": true,
            "topic": "distributed",
            "tech": ["Rust", "gRPC", "Postgres", "Redis", "AWS", "Terraform"],
            "tags": ["distributed-systems", "rust"],
            "status": "complete"
        }),
        6,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Project,
        "genuine-dev",
        "genuine.dev — this site",
        Some("A hexagonal Rust API + Next.js CMS with a custom directive renderer."),
        FOLIO_MD,
        json!({
            "featured": true,
            "topic": "rust",
            "tech": ["Rust", "axum", "Next.js", "Postgres", "syntect"],
            "tags": ["fullstack", "rust"],
            "status": "wip"
        }),
        40,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Project,
        "db-labs",
        "db-labs — relational DBMS from scratch",
        Some(
            "From-scratch relational DBMS in Rust — buffer pool, B+ tree, executors, transactions.",
        ),
        DB_LABS_MD,
        json!({
            "featured": true,
            "topic": "systems",
            "tech": ["Rust", "systems", "database"],
            "tags": ["database", "rust", "systems"],
            "github": "https://github.com/genuinebnt/db-labs"
        }),
        12,
    )
    .await?;

    // ── About page ──────────────────────────────────────────────────────────────
    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Page,
        "about",
        "About",
        Some("Systems engineer, Rustacean, and bug-bounty hunter."),
        ABOUT_MD,
        json!({}),
        0,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Page,
        "home",
        "I build systems and write about how they break.",
        None,
        HOME_MD,
        json!({}),
        0,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Page,
        "uses",
        "What I use",
        Some("The actual stack, not the aspirational one."),
        USES_MD,
        json!({ "eyebrow": "Uses" }),
        0,
    )
    .await?;

    insert(
        &repo,
        &renderer,
        skip_existing,
        matches!(mode, SeedMode::Upsert),
        Kind::Page,
        "now",
        "What I'm doing right now",
        Some("Updated June 2026 · inspired by nownownow.com"),
        NOW_MD,
        json!({ "eyebrow": "Now", "last_updated": "June 2026" }),
        0,
    )
    .await?;

    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn insert(
    repo: &PgContentRepository,
    renderer: &MarkdownRenderer,
    skip_existing: bool,
    upsert: bool,
    kind: Kind,
    slug: &str,
    title: &str,
    summary: Option<&str>,
    markdown: &str,
    metadata: serde_json::Value,
    days_ago: i64,
) -> Result<(), AppError> {
    let slug = Slug::parse(slug)
        .expect("seed slug is valid")
        .as_str()
        .to_owned();
    let existing = repo.get_by_slug(&slug).await?;
    if skip_existing && existing.is_some() {
        tracing::debug!("seed skip existing '{slug}'");
        return Ok(());
    }
    let rendered = renderer.render(markdown);
    let doc = Document {
        id: existing.as_ref().map(|d| d.id).unwrap_or_else(Uuid::now_v7),
        slug,
        kind,
        title: title.to_owned(),
        summary: summary.map(str::to_owned),
        body_markdown: markdown.to_owned(),
        body_html: rendered.html,
        reading_min: rendered.reading_min,
        status: Status::Published,
        cover_image: existing.as_ref().and_then(|d| d.cover_image.clone()),
        metadata,
        published_at: existing
            .as_ref()
            .and_then(|d| d.published_at)
            .or_else(|| Some(OffsetDateTime::now_utc() - Duration::days(days_ago))),
    };
    if upsert {
        let kind_str = kind.as_str();
        let slug_log = doc.slug.clone();
        repo.upsert(&doc).await?;
        tracing::info!("seed upserted {kind_str} '{slug_log}'");
    } else {
        let kind_str = kind.as_str();
        let slug_log = doc.slug.clone();
        repo.create(&doc).await?;
        tracing::info!("seeded {kind_str} '{slug_log}'");
    }
    Ok(())
}

// ─────────────────────────── Blog posts ────────────────────────────────────────

const LOCKFREE_PART1_MD: &str = r#"A compare-and-swap only checks a pointer's *value* — not its history. That gap
is the **ABA problem**, and it's the reason a naive lock-free stack corrupts under
contention.

## The ABA problem

```rust filename="queue.rs" highlight="3"
loop {
    let head = self.head.load(Ordering::Acquire);
    let next = unsafe { (*head).next };  // danger lives here
    if self.head.compare_exchange(head, next, Acquire, Relaxed).is_ok() {
        break;
    }
}
```

:::aside 🦀 "Ferris' hot tip"
If you free that node between the `load` and the `compare_exchange`, another
thread can reuse the exact same address — same pointer value, totally different
node. CAS says "looks fine!" and you've corrupted the queue. That's ABA.
:::

## Why tagging works

crossbeam attaches a generation counter to each pointer. The CAS now compares
`(pointer, tag)` together, so a recycled address with a bumped tag fails the
swap — exactly what we want.

:::callout ⚠ "Gotcha"
Tagging needs spare bits in the pointer (alignment) or a double-width CAS. On
64-bit with 8-byte alignment you get 3 low bits for free — usually enough.
:::

## Takeaways

- Lock-free ≠ wait-free. Our queue is lock-free; a thread can spin indefinitely
  if others keep succeeding.
- ABA is silent — the code compiles and *mostly* works in tests.
- Reach for `crossbeam-epoch` before rolling your own — which is exactly what
  [the next post](/blog/reclaiming-memory-hazard-pointers-vs-epochs) is about.
"#;

const LOCKFREE_PART2_MD: &str = r#"The queue from [part one](/blog/writing-a-lock-free-queue-from-scratch) works —
until you try to `free` a popped node. Who guarantees no other thread still holds
a pointer to it? That's the **memory reclamation** problem, and it has two classic
answers.

## Hazard pointers

Each thread publishes the pointers it's currently dereferencing into a shared,
per-thread "hazard" slot. A node can only be freed once no hazard slot references
it.

:::callout ℹ "The trade-off"
Hazard pointers give tight, predictable memory bounds — at most `O(threads × K)`
unreclaimed nodes. The cost is a memory fence on *every* access to publish the
hazard, which hurts read-heavy workloads.
:::

## Epoch-based reclamation

Threads advance through global *epochs*. Retired nodes are stashed in per-epoch
bags and only freed once every thread has moved two epochs past the retirement.

```rust filename="reclaim.rs" highlight="2,3"
let guard = epoch::pin();              // enter the current epoch
let shared = self.head.load(Acquire, &guard);
guard.defer_destroy(shared);           // freed once all threads advance
```

:::aside 🦀 "Ferris' hot tip"
Epoch reclamation is what `crossbeam-epoch` uses under the hood. Pinning is cheap
(a single atomic), which is why it usually wins for general-purpose structures.
:::

## Which one?

:::cards
:::card worker "Hazard pointers" "owns: bounded memory"
- read fence per access
- tight memory bound
Best when you must cap unreclaimed memory hard — allocators, embedded systems.
:::
:::card queue "Epoch-based" "owns: throughput"
- cheap pinning
- deferred batch free
Best for general-purpose structures where a brief reclamation lag is fine.
:::
:::

The short version: **epochs for throughput, hazard pointers for bounded memory.**
"#;

const SSRF_MD: &str = r#"Server-Side Request Forgery turns *your* server into *my* HTTP client. Point it at
`169.254.169.254` and a cloud metadata service hands over credentials. Here's a
real-shaped walkthrough of how a benign-looking feature became a full read of an
internal network.

## The entry point

A "link preview" endpoint fetched any URL the user submitted and rendered its
`<title>` and `og:image`. Classic SSRF surface.

```http filename="request.http" highlight="2"
POST /api/preview HTTP/1.1
{ "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/" }
```

:::callout ⚠ "Why this is dangerous"
The metadata endpoint requires no authentication — it trusts the network position.
A server that fetches attacker-controlled URLs *is* that trusted position.
:::

## Escalation path

:::timeline
1 Confirm SSRF — fetch a server you control, see the request land.
2 Probe internal ranges — 169.254.169.254, 10.0.0.0/8, localhost ports.
3 Read IAM creds — temporary keys from the metadata service.
4 Pivot — use the keys against internal dashboards and S3.
:::

## The fix

:::cards
:::card gateway "Allowlist" "owns: which hosts are reachable"
- deny RFC-1918
- deny link-local
Resolve the host, check the *resolved IP* against a denylist — not the string.
:::
:::card delivery "IMDSv2" "owns: metadata hardening"
- require a session token
- hop limit = 1
Session-token metadata defeats the simplest SSRF-to-credentials chain.
:::
:::

:::aside 🔒 "Disclosure note"
This composite walkthrough is for education and authorized testing only. Never
point these techniques at infrastructure you don't have written permission to test.
:::
"#;

const SKIP_LOCKED_MD: &str = r#"You don't always need Kafka. For a lot of workloads, Postgres *is* the queue — and
`SKIP LOCKED` is the one keyword that makes it work under concurrency.

## The whole queue

```sql filename="dequeue.sql" highlight="3,4"
UPDATE jobs SET status = 'claimed'
WHERE id = (
    SELECT id FROM jobs WHERE status = 'pending'
    ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1
)
RETURNING *;
```

## Why it doesn't block

Without `SKIP LOCKED`, two workers running this query at once would serialize:
the second blocks on the first's row lock. With it, the second worker *skips* any
row already locked and grabs the next available one.

:::callout ℹ "The mental model"
`FOR UPDATE` says "lock these rows." `SKIP LOCKED` adds "...and ignore the ones
someone else already locked." Together they give you contention-free, concurrent
dequeue with zero coordination.
:::

:::aside 🦀 "Ferris' hot tip"
Pair this with `LISTEN/NOTIFY` to wake workers on insert instead of polling. Push
for latency, pull (this query) for correctness. That combo is the heart of every
Postgres-native queue — Graphile Worker, River, and [NotiQ](/projects/notiq).
:::

## When to reach for a real broker

- Throughput beyond what a single primary can sustain.
- Cross-region replication of the queue itself.
- Fan-out to many independent consumer groups.

Until then, the database you already operate is one `SKIP LOCKED` away from being
a perfectly good job queue.
"#;

const CONSISTENT_HASH_MD: &str = r#"Consistent hashing shows up in every distributed systems interview — and in
production at [NotiQ](/projects/notiq), Cassandra, and Dynamo-shaped stores. The
idea is simple; the *details* (virtual nodes, bounded loads, rebalancing) are where
teams actually lose sleep.

## The naive problem

Modulo hashing (`hash(key) % N`) is easy until `N` changes. Add a worker and almost
every key moves — a thundering herd of cache misses and shard migrations.

Consistent hashing maps keys and nodes onto a ring. When a node leaves, only keys
*near* that node on the ring need to move — not the whole keyspace.

## Virtual nodes

One physical machine as a single point on the ring is a hotspot magnet: remove it and
its entire arc lands on one successor.

**Virtual nodes** (vnodes) spread each physical worker at many points on the ring:

:::callout ℹ "The 150 heuristic"
Cassandra's default of ~150 vnodes per host is a well-studied compromise — enough
spread to avoid hot successors, not so many that metadata overhead dominates.
Tune for your skew, not for folklore.
:::

## What to watch in production

:::cards
:::card ring "Rebalance cost" "owns: migration bandwidth"
- measure keys moved per topology change
- throttle background transfers
A ring change during peak traffic without rate limits is an outage.
:::
:::card worker "Hot keys" "owns: skew"
- salting / sub-sharding
- separate hot-key cache tier
Hashing doesn't fix popularity — it only spreads *average* load.
:::
:::

When you're building membership + routing, pair consistent hashing with a gossip layer
(see [SWIM gossip](/blog/swim-gossip-membership-basics)) so the ring view converges
without a single coordinator.
"#;

const EXPLAIN_MD: &str = r#"The first time someone runs `EXPLAIN ANALYZE` on a slow query, they either panic
at **Seq Scan** or celebrate **Index Scan** without reading the numbers. Both reactions
are wrong often enough to hurt.

## Start with actual time

```sql filename="explain.sql" highlight="1"
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM posts WHERE topic = 'rust' ORDER BY published_at DESC LIMIT 20;
```

`ANALYZE` runs the query; `BUFFERS` tells you whether you're hitting shared buffers
or disk. *Wall time* and *rows* matter more than the operator name.

## Seq scan vs index scan

:::aside 🦀 "Ferris' hot tip"
Postgres may choose a seq scan when it expects to read a large fraction of the table
anyway — an index lookup + heap fetch for half the rows is *more* expensive than one
sequential pass. Small tables almost always seq scan.
:::

## Red flags in the plan

:::timeline
1 **Nested Loop** with huge row estimates on the inner side — missing index or stale stats.
2 **Sort** on millions of rows — consider an index that matches `ORDER BY`.
3 **Buffers: read=… written=…** dominated by `read` — you're IO-bound, not CPU-bound.
4 **Planning time** spikes — check for prepared-statement churn or pooler mode mismatches (see [pooling pitfalls](/blog/postgres-connection-pooling-pitfalls)).
:::

## Fix order

1. `ANALYZE` / autovacuum health — bad stats lie to the planner.
2. Indexes that match filter + sort columns.
3. Query shape — fewer round trips beats micro-optimizing operators.

`EXPLAIN` is a conversation with the planner, not a scoreboard.
"#;

const IDOR_MD: &str = r#"Insecure Direct Object Reference (IDOR) sounds like "broken access control" because
it is — but in bug bounty programs it often shows up as **perfectly valid UUIDs** in
URLs and APIs that never ask *"does this user own this object?"*

## The pattern

```http filename="request.http" highlight="1"
GET /api/v1/invoices/7c9e6679-7425-40de-944b-e07fc1f90ae7 HTTP/1.1
Authorization: Bearer <user-a-token>
```

User A's token. User B's invoice ID. If the response is 200 with B's PDF, you have
IDOR — not "UUID guessing," just missing authorization.

:::callout ⚠ "Why UUIDs don't save you"
UUIDs are identifiers, not secrets. They leak in emails, analytics, referrers, and
browser history. Security through obscurity fails the moment one ID crosses a trust boundary.
:::

## How to hunt it

:::timeline
1 Create two accounts — low-privilege "victim" and your tester account.
2 Capture object IDs from the victim session (export, share link, notification email).
3 Replay requests from the tester session with the victim's IDs.
4 Mutate verbs — `GET` might be locked down while `PATCH` or `DELETE` isn't.
:::

## The fix

:::cards
:::card gateway "Authorize on every handler" "owns: object ownership"
- resolve resource → owner tenant/user
- deny by default
Middleware auth ≠ resource auth. Check ownership *after* you load the row.
:::
:::card delivery "Opaque IDs at the edge" "owns: public references"
- signed tokens / capability URLs
- separate internal vs external IDs
Defense in depth — but never skip server-side checks.
:::
:::

For a network-layer cousin of "trust the wrong boundary," see [SSRF walkthrough](/blog/ssrf-to-internal-dashboards).
"#;

const TOKIO_SCHED_MD: &str = r#"Tokio feels like magic until one task runs a 200ms CPU loop on a worker thread and
every other future on that worker stalls. Async Rust is **cooperative** — tasks must
yield explicitly or at await points.

## Workers and the run queue

Each Tokio worker thread pulls tasks from a local queue (and occasionally steals from
siblings). There's no preemption: a future that never awaits monopolizes its worker.

```rust filename="bad-task.rs" highlight="3-5"
async fn poison() {
    loop {
        heavy_cpu(); // no .await — blocks the worker
    }
}
```

:::callout ⚠ "Gotcha"
`block_in_place` and `spawn_blocking` exist for a reason — don't call blocking IO or
long CPU work inside async fn bodies without them.
:::

## Task budgets (Tokio 1.x+)

Tokio can **stop polling** a task after a budget expires, forcing other tasks on the
same worker to run. This mitigates starvation but doesn't replace good hygiene.

:::aside 🦀 "Ferris' hot tip"
If you're CPU-bound, use `rayon` or a dedicated thread pool. Async is for waiting,
not for saturating cores — that's what threads are for.
:::

## Checklist

- Await at natural boundaries; chunk long loops with `yield_now().await`.
- Move blocking work to `spawn_blocking`.
- Watch p99 latency when load mixes fast handlers with heavy ones — starvation shows up
  as tail latency, not average CPU.

Pinning and self-referential futures interact with this model too — see [Pin in practice](/blog/rust-pin-and-self-referential-structs).
"#;

const RAFT_MD: &str = r#"Raft exists because Paxos is correct and unreadable. Leader election is the piece
everyone sketches on a whiteboard and then gets subtly wrong in code.

## Roles and terms

Each server is follower, candidate, or leader. **Terms** are logical clocks — a stale
leader's writes must be rejected once a newer term has begun.

## Election in one pass

:::timeline
1 Follower times out (no heartbeat from leader) → becomes **candidate**, increments term, votes for self.
2 Sends `RequestVote` RPCs to peers; needs a **majority** to win.
3 Winner becomes leader; sends heartbeats; followers accept append entries.
4 Loser or split vote → new election after randomized timeout.
:::

## Split votes aren't failure

If two candidates split the vote, *no* leader is chosen — and that's correct. Randomized
election timeouts make another round likely to pick a single winner.

```rust filename="election.rs" highlight="4-6"
if self.state == State::Candidate && votes_received > quorum {
    self.state = State::Leader;
    self.send_heartbeats();
}
```

:::callout ℹ "The mental model"
Raft trades availability during partitions for understandability. You still need
application-level conflict handling — consensus replicates an ordered log, not your
business rules.
:::

## Where it shows up

etcd, TiKV, and countless homework implementations. [NotiQ](/projects/notiq) uses
Postgres advisory locks for scheduler leadership — a different tool, same *"one
decider"* shape. For membership before consensus, see [SWIM gossip](/blog/swim-gossip-membership-basics).
"#;

const PIN_MD: &str = r#"`Pin` is the type that makes people bounce off async Rust. It's not ceremony for
its own sake — it's how the language keeps **self-referential structs** (most async
state machines) from moving in memory while pointers inside them still point inward.

## The problem

```rust filename="self-ref.rs" highlight="2-3"
struct Bad {
    slice: [u8; 4],
    ptr: *const u8, // would point into slice if we built it wrong
}
```

If `Bad` moved, `ptr` would dangle. Async futures often embed pointers into their
own stack frame — same issue, bigger scale.

## Pin breaks the move

`Pin<P>` promises not to move the pointee (unless `Unpin`). The compiler then allows
safe APIs that rely on a stable address.

:::aside 🦀 "Ferris' hot tip"
Most types are `Unpin` — ordinary structs move freely. Pin matters for generated future
state machines and manual self-referential code. You'll feel it in `async` traits and
some stream adapters long before you write Pin yourself.
:::

## Practical guidance

:::cards
:::card stack "When you need Pin" "owns: stable address"
- async state machines
- intrusive lists / self-referential buffers
If you're not building those, you probably import Pin because a trait requires it.
:::
:::card heap "When you don't" "owns: everyday Rust"
- `Box<T>` + no internal pointers into self
- data moved by value only
Don't Pin everything "just in case."
:::
:::

For the concurrency story that makes all this matter, start with [lock-free part one](/blog/writing-a-lock-free-queue-from-scratch).
"#;

const BPF_MD: &str = r#"eBPF started as "run tiny programs in the kernel safely." For observability, **kprobes**
let you attach at function entry/return and export histograms without a custom kernel
module — until you overdo it and measure the observer more than the system.

## What a kprobe gives you

Attach to `tcp_sendmsg`, record timestamp delta to userspace, aggregate p99 latency.
No recompile, no `printk` spam — verifier-checked bytecode instead.

```c filename="latency.bpf.c" highlight="1"
SEC("kprobe/tcp_sendmsg")
int BPF_KPROBE(tcp_sendmsg_entry) {
    // store start ts keyed by pid/tid
    return 0;
}
```

:::callout ⚠ "Gotcha"
Probes run in kernel context on hot paths. Heavy maps, string formatting, or unbounded
loops fail verification or cost more than the syscall you're measuring.
:::

## When BPF beats strace

- Production-safe sampling at high QPS.
- Aggregated metrics in-kernel (histograms, per-cgroup counts).
- No stop-the-world attach to every process.

When you need full argument capture or userspace stacks only, `perf` / `eBPF` stack
walkers / `tokio-console` may be simpler starting points.

:::aside 🦀 "Ferris' hot tip"
Start with off-the-shelf tools (`bpftrace`, `bcc`) before writing C. Custom probes
shine when you have a specific kernel boundary and a SLO to defend — not for hello world.
:::

Pair latency tracing with [reading EXPLAIN](/blog/reading-postgres-explain-analyze) on
the database side — most "mystery slowness" is two hops, not one.
"#;

const SWIM_MD: &str = r#"Heartbeats through a central server don't scale: the coordinator becomes a SPoF and
a fan-in bottleneck. **SWIM** (Scalable Weakly-consistent Infection-style Process group
Membership) spreads failure detection with gossip — the same family [NotiQ](/projects/notiq)
uses for worker membership.

## Ping → ack → suspect

Each node periodically picks a random peer and sends a **ping**. No ack within timeout?
**Indirect probe**: ask other nodes to ping the target. Still silent? Mark **suspect**,
then propagate via infection-style gossip.

## The false-positive knob

Aggressive timeouts catch failures fast but flag healthy nodes on slow networks.
Conservative timeouts delay failover. There is no free lunch — only a tunable trade-off.

:::callout ℹ "The mental model"
SWIM gives you *eventually consistent membership* — not a linearizable registry.
Your routing layer (consistent hash ring, load balancer) must tolerate brief disagreement.
:::

## Ops checklist

:::timeline
1 Set probe intervals from **p99 network RTT**, not mean.
2 Cap gossip fan-out — infection-style, not broadcast storms.
3 On suspect → confirm before draining — flapping nodes hurt more than slow detection.
4 Log *why* a node was marked (direct vs indirect timeout) — postmortems need it.
:::

For where membership meets data placement, read [consistent hashing](/blog/consistent-hashing-virtual-nodes).
For consensus *after* you know who's alive, [Raft election](/blog/raft-leader-election-walkthrough).
"#;

const CHECKOUT_MD: &str = r#"Logic bugs pay bounties when authorization holds but **business rules don't**. Checkout
flows are gold: price, quantity, coupons, and shipping interact — and the UI is rarely
the source of truth.

## Classic shapes

:::cards
:::card cart "Negative quantity" "owns: cart arithmetic"
- `-1` × price → credit
- integer overflow on totals
Server must recompute totals; never trust client JSON.
:::
:::card gateway "Coupon stacking" "owns: discount rules"
- apply expired code via replay
- stack incompatible promos via parameter pollution
State machine for discounts, not nested `if`s in one handler.
:::
:::

## How to test safely

Capture the checkout API with two accounts. Replay with:

- swapped `product_id` to a cheaper SKU while keeping displayed name metadata.
- `quantity: 0` or fractional values if the schema is loose.
- race double-submit on payment intent creation.

:::callout ⚠ "Why this isn't IDOR"
IDOR is "access someone else's object." Logic bugs are "access your own cart with
rules the developer forgot." Both pay; the hunt looks different. See [IDOR patterns](/blog/idor-via-predictable-ids) for the other side.
:::

## Fix posture

Single **pricing service** (or function) used by cart, checkout, and receipts. Property
tests on invariants: total ≥ 0, discounts ≤ subtotal, inventory non-negative.
"#;

const MEMORY_ORDER_MD: &str = r#"The Rust memory model docs are precise and cold. On a hot path you need a smaller
question: *what synchronization does this atomic actually guarantee?*

This is part three of the [lock-free series](/blog/writing-a-lock-free-queue-from-scratch) —
after [ABA/tagging](/blog/writing-a-lock-free-queue-from-scratch) and [reclamation](/blog/reclaiming-memory-hazard-pointers-vs-epochs).

## The three you use daily

:::cards
:::card worker "Relaxed" "owns: atomicity only"
- counters, statistics
- no cross-thread ordering
Cheapest. Don't use for publishing a pointer others will dereference.
:::
:::card queue "Acquire / Release" "owns: publish-subscribe"
- Release store after writing data
- Acquire load before reading it
The default pattern for lock-free handoff.
:::
:::card ring "SeqCst" "owns: global order"
- rare in app code
- debugging heisenbugs
Strongest, slowest. Reach for it when weaker orders fail and you need proof.
:::
:::

## A handoff that works

```rust filename="handoff.rs" highlight="4-5"
data.write(payload);
ready.store(true, Ordering::Release);

if ready.load(Ordering::Acquire) {
    let v = data.read();
}
```

:::aside 🦀 "Ferris' hot tip"
If you're mixing atomics and mutexes on the same data, stop — pick one story. Hybrid
"mostly lock-free" code is where ordering bugs hide for months.
:::

## When to read the spec

Before you ship a general-purpose concurrent crate. Before you argue on Twitter.
For application queues and metrics, Acquire/Release + `crossbeam` gets you home.
"#;

const POOLING_MD: &str = r#"Connection poolers (PgBouncer, RDS Proxy, serverless Postgres) fix "too many connections"
and create a new class of **works on my laptop** bugs. Most of them involve transactions,
prepared statements, and which pool *mode* you're in.

## Session vs transaction pooling

**Session mode** — one server connection per client for the whole client session. Safest;
least multiplexing.

**Transaction mode** — server connection assigned only for the duration of a transaction.
Between transactions, session state (prepared statements, `SET`, temp tables) is lost or
shared wrongly.

:::callout ⚠ "Gotcha"
ORMs that prepare statements implicitly + PgBouncer transaction pooling = `prepared statement
"foo" does not exist` at 3am under load.
:::

## Symptoms under load

:::timeline
1 Intermittent `42P05` / missing prepared statement — pool mode mismatch.
2 `SET search_path` or timezone "randomly" wrong — session state leaked across clients.
3 Idle-in-transaction timeouts — long requests hold pool slots; everything else queues.
4 Planner surprises after deploy — new query shapes without updated stats (see [EXPLAIN](/blog/reading-postgres-explain-analyze)).
:::

## Practical defaults

- App servers → **session mode** unless you truly understand transaction pooling.
- Use PgBouncer `pool_mode = session` for ORMs; transaction mode for stateless micro-handlers only.
- Size pools from **Postgres `max_connections`**, not "one pool entry per thread."

[SKIP LOCKED workers](/blog/what-skip-locked-actually-does) still need sane pool sizing —
a fast dequeue loop with 500 idle connections helps nobody.
"#;

// ─────────────────────────── NotiQ project (recreates notiq_portfolio.html) ─────

const NOTIQ_MD: &str = r#"Eight Rust microservices communicating over gRPC and a Postgres-native job queue.
Built to explore what actually breaks when you operate a reliable delivery system
at scale — gossip-based membership, consistent hashing, lock-free concurrency, and
end-to-end backpressure across service boundaries.

## System architecture

A single public entry (`gateway-svc`) fronts a write path (`enqueue-svc`), a
horizontally-scaled worker tier (`worker-svc`, with SWIM gossip + consistent
hashing), three isolated delivery services (email / SMS / webhook), a
`scheduler-svc`, and an `admin-svc` CQRS read model. Postgres is the queue broker;
Redis carries rate-limit, idempotency, and backpressure state.

## Services — bounded contexts

:::cards
:::card gateway "gateway-svc" "owns: auth, routing, tenant resolution"
- API Gateway pattern
- circuit breaker
- token bucket
- mTLS
Single public entry point. JWT validation, per-tenant rate limiting via atomic Lua scripts in Redis, and downstream routing via gRPC. Circuit breaker implemented as a custom Tower::Layer — trips on error rate threshold, half-opens to probe recovery.
:::
:::card queue "enqueue-svc" "owns: job ingestion, outbox, idempotency"
- outbox pattern
- Bloom filter
- SKIP LOCKED
- event sourcing
Writes job + outbox row in a single transaction — no dual-write risk. Bloom filter pre-screens idempotency keys before the Redis round-trip, cutting ~80% of duplicate checks. Job state is an append-only event log, never an overwritten status column.
:::
:::card worker "worker-svc" "owns: dequeue, shard routing, fan-out"
- consistent hashing
- SWIM gossip
- lock-free MPSC
- backpressure
N instances, each a gossip node. A BTreeMap vnode ring routes notifications to shards — join/leave migrates only adjacent keys (~1/N). Lock-free MPSC channels connect the gossip, dequeue, and fan-out tasks inside each instance. No mutex on the hot path.
:::
:::card delivery "delivery-email" "owns: SES delivery, email retry state"
- bulkhead
- SES rate awareness
- decorrelated jitter
Calls SES v2 with send-rate awareness — tracks quota consumption and signals backpressure upstream before hitting the SES throttle. Separate ECS service with its own pool. A SES outage cannot starve SMS or webhook workers.
:::
:::card delivery "delivery-sms" "owns: Twilio delivery, SMS retry state"
- bulkhead
- per-tenant rate limit
- decorrelated jitter
Twilio HTTP client with per-tenant send-rate limiting via Redis token bucket. Separate failure domain — a Twilio outage or rate-limit breach is contained here. Retry uses decorrelated jitter across transient errors and Twilio 429s.
:::
:::card delivery "delivery-webhook" "owns: HTTP delivery, HMAC signing"
- bulkhead
- HMAC-SHA256
- strict timeout
Outbound POST with HMAC-SHA256 payload signing so receivers verify authenticity without a shared secret in the URL. Strict per-request timeout stops a slow consumer from blocking the pool. Retries on 5xx; 4xx goes straight to dead-letter.
:::
:::card scheduler "scheduler-svc" "owns: cron, delayed jobs, saga orchestration"
- min-heap
- saga
- distributed lock
BinaryHeap over next_run_at — O(1) peek, O(log N) insert. A Postgres advisory lock ensures only one replica fires a given job across a scaled deployment. Orchestrates multi-step flows with explicit compensation on failure.
:::
:::card admin "admin-svc" "owns: tenant ops, read model, dead-letter"
- CQRS
- RDS read replica
- event replay
Separate read path — queries delivery_log and job_events projections from the RDS read replica. Writes go through enqueue-svc; reads never touch the primary. Dead-letter replay and job-state reconstruction from the event log.
:::
:::

## Service communication

:::matrix
| call | protocol | pattern | failure handling |
|---|---|---|---|
| gateway → enqueue-svc | gRPC | sync request/reply | circuit breaker trips → 503 to client |
| gateway → admin-svc | gRPC | sync request/reply | circuit breaker → graceful degradation |
| enqueue-svc → worker-svc | async queue | outbox + CDC + LISTEN/NOTIFY | worker down → jobs persist in Postgres, zero loss |
| worker-svc → delivery-* | gRPC | fan-out, bulkhead per channel | channel down → dead-letter; others unaffected |
| scheduler-svc → enqueue-svc | gRPC | saga orchestration step | enqueue fail → saga compensates in reverse |
| worker-svc ↔ worker-svc | UDP gossip | SWIM probe + epidemic broadcast | partition → suspect → dead → ring rebalance |
| all services → Postgres | TCP / sqlx pool | connection pool, schema per service | Multi-AZ failover, pool reconnect |
| all services → Redis | TCP / fred-rs | rate limit · idempotency · backpressure | Redis down → configurable allow-all fallback |
:::

## How it was built — key decisions

:::accordion 1 "Postgres as the queue broker" "SKIP LOCKED · LISTEN/NOTIFY · outbox · event sourcing"
:::decision "Why Postgres, and where it breaks"
A Postgres-native queue (like Graphile Worker, River, Oban) keeps job state transactional with the rest of the app. No external broker, no dual-write race, no new failure domain. The honest tradeoffs: Postgres becomes the throughput ceiling at very high write rates, WAL amplifies under heavy churn, and cross-region queue replication is hard. Acceptable for this scale.
:::
:::decision "SKIP LOCKED for concurrent dequeue"
Multiple workers claim different jobs from the same table with zero serialization conflicts — no advisory locks, no SELECT FOR UPDATE blocking. Rows locked by another transaction are skipped entirely. The same mechanism behind pgqueue, Graphile Worker, and River.
:::
:::decision "LISTEN/NOTIFY for low-latency wake"
Workers sleep on a Postgres channel and wake on INSERT rather than polling. Push for latency, pull for correctness — the outbox CDC task guarantees at-least-once delivery regardless of whether the notification arrived.
:::
:::decision "Event log, not status column"
Job state is an append-only sequence: Enqueued → Claimed → Failed → Retried → Delivered. Current state is a projection. Audit trail is free, replay is exact. Overwriting a status column destroys history and makes debugging retried failures guesswork.
:::
:::

:::accordion 2 "Distributed worker fleet" "consistent hashing · SWIM gossip · lock-free concurrency"
:::decision "Consistent hashing for shard routing"
BTreeMap vnode ring over a 2³² token space. 150 virtual nodes per worker smooth distribution. On join/leave, only the adjacent token range migrates — ~1/N of total keys. Proven with a test: add a worker, measure the fraction of keys that moved.
:::
:::decision "SWIM-lite for membership"
Direct ping → suspect on timeout → indirect ping via K random peers → dead on no ack. Epidemic broadcast piggybacks membership deltas on outgoing pings — O(log N) convergence without a coordinator. A dead event triggers ring rebalance automatically.
:::
:::decision "Lock-free MPSC between tasks"
crossbeam-channel connects the gossip, dequeue, and fan-out tasks inside each instance. No mutex on the hot path. AtomicU8 for node liveness with Acquire/Release ordering — not SeqCst, which would be correct but unnecessarily expensive.
:::
:::decision "Zero-copy payload fan-out"
Payloads are wrapped in bytes::Bytes. Fan-out to N delivery channels clones the Arc pointer, not the heap allocation. A criterion benchmark with allocation counting confirms zero extra heap allocations per channel.
:::
:::

:::accordion 3 "Reliability under failure" "bulkhead · circuit breaker · backpressure · chaos testing"
:::decision "Three delivery services, not one"
Email, SMS, and webhook are separate ECS services with separate pipelines and failure domains. A SES outage tripping circuits has zero effect on Twilio throughput. The bulkhead makes failure boundaries explicit rather than accidental.
:::
:::decision "End-to-end backpressure"
Each delivery service signals capacity upstream near saturation. worker-svc aggregates via an atomic queue-depth counter and propagates upstream to enqueue-svc. Unbounded queues cause silent data loss; this prevents it.
:::
:::decision "Decorrelated jitter, not exponential"
Naive exponential backoff synchronizes retries across instances and causes thundering herd after mass failure. Decorrelated jitter (sleep = min(cap, random(base, prev × 3))) keeps retry waves spread over time.
:::
:::decision "Chaos test suite"
A --chaos flag randomly kills workers mid-flight, delays acks, and injects partitions. A run audits the delivery_log and proves zero message loss. That's the only real proof of reliability — review alone isn't enough.
:::
:::

:::accordion 4 "Cloud infrastructure" "ECS · RDS · Terraform · IAM · observability"
:::decision "Everything in Terraform"
VPC with public/private split, SGs as code, one ECS task definition per service, RDS multi-AZ + read replica, ElastiCache, Secrets Manager, KMS, Route 53, ACM. Nothing clicked in the console — infra is reproducible and reviewable.
:::
:::decision "IRSA over static credentials"
Each ECS task assumes its own least-privilege IAM role via IRSA. enqueue-svc writes S3 and reads Secrets Manager; delivery-email calls SES. No shared credentials, no static keys in env vars or images.
:::
:::decision "Custom scaling metric"
worker-svc auto-scales on a custom CloudWatch metric — Postgres queue depth — not CPU. CPU is the wrong signal for a queue worker: low when idle, spiking when overwhelmed. Queue depth is what actually needs to scale against.
:::
:::decision "OpenTelemetry throughout"
Every service emits traces via tracing-opentelemetry. One trace ID spans gateway → enqueue → worker → delivery across gRPC boundaries via propagated context. OTLP export to CloudWatch in prod, Jaeger locally.
:::
:::

:::accordion 5 "Service communication choices" "gRPC · protobuf · per-service schema · UUID v7"
:::decision "gRPC over REST for inter-service"
gRPC gives strongly-typed protobuf contracts, generated client stubs, binary encoding (~3-10× smaller than JSON), and streaming. Breaking changes are caught at compile time, not at runtime in production.
:::
:::decision "Per-service Postgres schema"
Each service owns its tables under a named schema. No service queries another's tables directly — cross-service reads go through gRPC. This enforces bounded-context ownership at the database level.
:::
:::decision "UUID v7 for sortable IDs"
UUID v4 is random — poor index locality, page splits under write load. UUID v7 is time-ordered: new rows land at the end of the index, giving sequential writes and far better insert throughput on jobs and job_events.
:::
:::decision "Tokio over async-std"
axum, tonic, sqlx, fred, and crossbeam all integrate directly with Tokio. Ecosystem coherence matters more than runtime micro-benchmarks at this scale.
:::
:::

## Engineering depth

:::tabs
:::tab "Microservices"
:::concept micro "Outbox pattern"
enqueue-svc writes job + outbox row in one transaction. A CDC task reads the outbox, publishes to worker-svc, then deletes the row — reliable publishing without a distributed transaction or dual-write race.
:::
:::concept micro "Saga — choreography vs orchestration"
Delivery fan-out uses choreography; multi-step scheduler flows use an explicit orchestration state machine that compensates in reverse on failure. Both patterns implemented, both understood.
:::
:::concept micro "Circuit breaker as Tower::Layer"
gateway-svc wraps downstream gRPC in a from-scratch breaker: Closed → Open on error rate, Open → Half-open after timeout, Half-open → Closed on probe success. Composable with other Tower middleware.
:::
:::concept micro "CQRS — separate read and write models"
Writes flow through enqueue-svc to the primary; reads through admin-svc against the read replica. The write model is normalized for correctness; the read model is denormalized for delivery analytics.
:::
:::
:::tab "Distributed systems"
:::concept dist "SWIM failure detection"
Direct ping → indirect ping via K peers → suspect → dead. Epidemic dissemination piggybacks on pings; convergence is O(log N). False-positive rate is tunable against detection latency — a real tradeoff.
:::
:::concept dist "Consistent hashing with virtual nodes"
BTreeMap over a 2³² token space, 150 vnodes per worker. A node leaving migrates only ~1/N of keys. Replication factor 2: each notification has a primary shard and one replica.
:::
:::concept dist "At-least-once with idempotency"
Jobs retry on failure; a Bloom filter pre-screens idempotency keys before a Redis SET NX confirms dedup. ~80% of duplicate checks never reach Redis. Delivery guaranteed, double-firing prevented.
:::
:::concept dist "End-to-end backpressure"
Delivery services signal saturation upstream via a flag in gRPC responses; worker-svc tracks it with an atomic counter and signals enqueue-svc to reject new jobs past threshold. Unbounded queues are the classic silent failure.
:::
:::
:::tab "Rust"
:::concept rust "Custom Tower middleware"
The circuit breaker is a Tower::Layer + Tower::Service pair with each state transition modeled explicitly — composable with auth and tracing layers without coupling.
:::
:::concept rust "Atomic memory ordering"
AtomicU8 encodes liveness (alive/suspect/dead). The gossip task writes with Release; routing reads with Acquire. SeqCst would also be correct but imposes a global fence — unnecessary for a single writer/reader pair.
:::
:::concept rust "Async stream composition with pin-project"
The CDC outbox reader is a self-referential async stream via pin-project. tokio::select! multiplexes the gossip and dequeue loops inside each task — explicit waker propagation, no missed wakeups.
:::
:::concept rust "Graceful shutdown with CancellationToken"
A tokio-util CancellationToken propagates through the task tree. On SIGTERM, in-flight jobs drain before exit — proven by running the chaos suite across a rolling ECS deploy.
:::
:::
:::tab "Performance"
:::concept perf "Lock-free MPSC on the hot path"
crossbeam-channel replaces a Mutex<VecDeque> between gossip, dequeue, and fan-out tasks. Benchmarked under 10k rps: measurably lower p99 and no lock-contention spikes.
:::
:::concept perf "Zero-copy fan-out"
Payloads held as bytes::Bytes; fanning out to 3 channels clones the Arc three times — no per-channel allocation. A criterion benchmark with allocation counting confirms a flat count.
:::
:::concept perf "Bloom filter to cut Redis round-trips"
A per-process Bloom filter pre-screens idempotency keys (zero false negatives). In duplicate-heavy workloads ~80% of Redis SET NX calls are skipped.
:::
:::concept perf "Atomic queue depth without contention"
Depth is an Arc<AtomicUsize> incremented on enqueue, decremented on completion. The backpressure check is a single atomic load — never blocks on the hot path under burst load.
:::
:::
:::tab "Algorithms"
:::concept dsa "BTreeMap as a hash ring"
BTreeMap<u32, WorkerId> maps token positions to workers; clockwise successor lookup is a range() call — O(log N). Ordered iteration makes successor lookup trivial without a custom structure.
:::
:::concept dsa "Min-heap for deadline scheduling"
BinaryHeap with Reverse<Instant> orders jobs by next_run_at. O(1) peek, O(log N) insert. The scheduler sleeps until the top deadline rather than polling.
:::
:::concept dsa "Bloom filter for probabilistic dedup"
Constant-time membership with zero false negatives; the false-positive rate trades against memory. Correct use requires understanding that asymmetry.
:::
:::concept dsa "Michael-Scott lock-free queue"
crossbeam-channel's internal queue is a CAS-based MPSC structure. Understanding the ABA problem and the CAS loop is the depth behind using the library.
:::
:::
:::

## AWS infrastructure

:::grid
:::gitem "ECS Fargate"
One task definition per service. Independent deploy pipelines. Auto-scales on queue depth, not CPU.
:::
:::gitem "ALB · Route 53"
ALB in public subnet, all services private. Per-tenant subdomain routing via listener rules. ACM TLS.
:::
:::gitem "RDS Postgres · Multi-AZ"
Multi-AZ primary for HA failover. Read replica for admin-svc's CQRS read model. RTO tested and measured.
:::
:::gitem "ElastiCache Redis"
Cluster mode. Rate limiting, idempotency keys, worker registry, channel backpressure signals.
:::
:::gitem "S3 · SSE-KMS"
Large payload spill, audit log export, pg_dump backup. Server-side encryption via KMS.
:::
:::gitem "IAM · IRSA"
Each ECS task assumes its own least-privilege role. No static keys anywhere.
:::
:::gitem "Secrets Manager"
DB credentials, API keys, and Twilio tokens fetched at startup per service. Rotation without redeploy.
:::
:::gitem "KMS"
RDS encryption at rest, S3 SSE-KMS, ACM Private CA for inter-service mTLS certificates.
:::
:::gitem "CloudWatch · X-Ray"
OTel OTLP export per service. Custom queue-depth metric drives auto-scaling. Distributed traces via X-Ray.
:::
:::gitem "VPC Endpoints"
Interface endpoints for S3, Secrets Manager, and ECR — traffic stays in the VPC, off the NAT path.
:::
:::gitem "WAF · Shield"
WAF on the ALB with rate-based rules before gateway-svc limiting. Shield Standard for volumetric DDoS.
:::
:::gitem "ECR · GitHub Actions"
One ECR repo per service. Image scanning on push. CI builds, tests, pushes on merge; rolling deploy with rollback.
:::
:::

## Decisions worth discussing

:::signals
:::signal "storage"
SKIP LOCKED gives lock-free row exclusion without advisory locks or serializable transactions. Compared to SELECT FOR UPDATE it never blocks — it simply skips locked rows and moves on.
:::
:::signal "storage"
LISTEN/NOTIFY isn't reliable for at-least-once delivery — a worker that crashes between notification and claim loses the message. The outbox CDC task handles guarantees independently; NOTIFY is only for low-latency wake.
:::
:::signal "microservices"
Outbox over dual-write: writing the queue row atomically with the job record means there's no window where the job exists but wasn't dispatched. The CDC task provides the eventual publishing guarantee.
:::
:::signal "microservices"
Circuit breaker as a Tower::Layer rather than a global flag: scoped to the downstream it protects, composable with other middleware, and testable in isolation.
:::
:::signal "distributed"
SWIM over a central heartbeat: a heartbeat server is a single point of failure and a bottleneck. SWIM scales O(log N) with no coordinator; the tradeoff is tunable false-positive latency, accounted for in chaos tests.
:::
:::signal "distributed"
Decorrelated jitter over exponential backoff: after a mass failure, naive exponential synchronizes retries across instances. Decorrelated jitter breaks that synchronization and prevents thundering herd.
:::
:::signal "infrastructure"
Queue depth as the ECS scaling metric instead of CPU: a queue worker's CPU is low when idle and spikes when overwhelmed. Queue depth is a leading indicator; CPU is a lagging one.
:::
:::signal "Rust"
bytes::Bytes for zero-copy fan-out: cloning an Arc is two atomic increments; cloning a Vec is a malloc + memcpy. At 3 channels per notification that's 3 allocations saved on the hot path — confirmed by an allocation-counting benchmark.
:::
:::
"#;

const DB_LABS_MD: &str = r#"A from-scratch relational DBMS in Rust — the third portfolio project alongside
NotiQ and genuine.dev. BusTub-shaped architecture: buffer pool, B+ tree index, query
executors, concurrency control, and WAL/recovery, all ported independently.

**Build focus:** P0 Count-Min Sketch primer is done. P1 Buffer Pool Manager is
the current work — ARC replacer, disk scheduler, page guards, 8 KB frames.

See the full case study at [/projects/db-labs](/projects/db-labs) for architecture
diagrams, build phases, and implementation status.

:::callout ℹ "Learning project"
Reference repos (bustub-private, SQLite) are read-only study material — every line
of db-labs engine code is typed by hand. [GitHub →](https://github.com/genuinebnt/db-labs)
:::
"#;

const FOLIO_MD: &str = r#"The site you're reading. A DB-backed CMS with a hexagonal Rust API, a Next.js
front end, and a custom markdown renderer that powers the `:::` directive blocks
used across these case studies.

## Why build it from scratch

Off-the-shelf CMSs hide exactly the parts worth learning. Building it surfaced real
decisions about boundaries, rendering, and a browser-based authoring experience.

## Architecture

:::cards
:::card gateway "backend (Rust)" "owns: domain, API, rendering"
- axum
- sqlx
- hexagonal
A modular monolith: pure `domain`, `app` use-cases behind port traits, and `infra` adapters (Postgres repo, syntect renderer, local-disk storage). The web layer is a thin JSON API.
:::
:::card worker "frontend (Next.js)" "owns: SSR, admin editor"
- React 19
- TipTap
- SCSS
Server-rendered reading experience plus a WYSIWYG admin editor that serializes back to markdown — so the render pipeline stays the single source of truth.
:::
:::

## The directive renderer

The interesting part is the renderer. Markdown flows through three passes: code
fences are syntax-highlighted with **syntect** (line numbers, highlighted lines),
then `:::` directives become themed HTML, then comrak handles the rest.

```rust filename="render.rs" highlight="2,3,4"
fn render(&self, markdown: &str) -> Rendered {
    let with_code = self.preprocess_code_blocks(markdown);
    let preprocessed = preprocess_directives(&with_code);
    let html = markdown_to_html(&preprocessed, &options);
    Rendered { html, reading_min: reading_time(markdown) }
}
```

:::callout ℹ "Source of truth"
Posts are stored as markdown, not HTML. The WYSIWYG editor round-trips to markdown
so the backend renderer always produces the final HTML — no drift between what you
edit and what ships.
:::

## Design signals

:::signals
:::signal "boundaries"
Ports are defined only at real seams (ContentRepository, Renderer, StorageBackend) — one impl now, a planned second later. No premature abstraction.
:::
:::signal "rendering"
Directives are custom editor nodes that store raw markdown source losslessly. Structured forms layer on top; the data contract never changes.
:::
:::

Built as a learning project, shipped as a real one.
"#;

const HOME_MD: &str = r#":::eyebrow Rust · Systems · Infosec
:::

# I build **systems** and write about how they break.

Backend & distributed-systems engineer working mostly in **Rust**. I write deep
technical posts on systems programming, distributed systems, and offensive/defensive
security.

:::meta-pills
Focus | Rust
Writing | coding · infosec
Bug bounty | active
Stack | axum · postgres
:::

:::home-divider
:::

:::featured-articles
:::

:::featured-projects selected projects
:::
"#;

const USES_MD: &str = r#":::uses-section #f0703c Languages
Rust | Primary language for everything systems. axum, tokio, sqlx, tonic, crossbeam. | daily
Python | LeetCode and scripting only. Not production. | weekly
SQL | Postgres almost exclusively. Raw queries over ORMs. | daily
TypeScript | Frontend — Next.js, React. Keeps JS sane enough. | active
:::

:::uses-section var(--blue) Editor
Neovim | rust-analyzer, nvim-cmp, telescope. Lua config in dotfiles. | daily
Cursor | AI-native editor for frontend work and rapid prototyping. | active
Helix | Backup editor. Kakoune-style selection model. | occasional
:::

:::uses-section var(--blue) Terminal
WezTerm | GPU-accelerated, Lua config, multiplexer built in. | daily
fish | Abbreviations over aliases. starship prompt. | daily
tmux | Session management on remote servers. | occasional
:::

:::uses-section var(--acc) Stack
axum | HTTP API layer. Tower middleware, clean ergonomics. | primary
tokio | Async runtime. The entire ecosystem depends on it. | primary
sqlx | Postgres client. Runtime-checked queries. | primary
Next.js | App Router, SSR. Portfolio and blog frontend. | active
:::

:::uses-section var(--purple) Hardware
MacBook Pro M2 | Apple Silicon. Static analysis only — can't run Linux ELFs natively. | primary
Yamaha F310 | Acoustic guitar. Learning fingerstyle alongside Hindi songs. | hobby
AirPods Pro | Transparency mode while coding. Noise cancellation for deep work. | daily
:::

:::uses-section var(--acc) Security
Burp Suite | Pro. Intercept, scanner, repeater. Primary bounty tool. | active
Ghidra | Static RE on Apple Silicon. C and x86-64 targets. | weekly
oob-catcher | My own OOB interaction server. Wildcard DNS + HTTP logging. | self-built
nmap | Network scanning and service fingerprinting. | active
:::
"#;

const NOW_MD: &str = r#"## Building

Finishing **genuine.dev** — the site you're reading — and the four-project Rust
backend roadmap that backs up the portfolio. NotiQ is done. Working through the
e-commerce platform next.

:::now-status
current project | genuine.dev | portfolio + blog, this site | acc
job hunt | Jan 2027 | targeting DB-infra companies | warn
:::

:::now-progress
NotiQ | 100 | acc
genuine.dev | 70 | blue
e-commerce platform | 0 | purple
Raft KV store | 0 | warn
:::

## Learning

Bug bounty on Bugcrowd — rotating through auth and business logic bugs right now. Reading
CMU 15-445 lecture notes alongside building. Hindi through songs as dual language + singing
practice.

:::now-chips
* bug bounty
* DB internals
Hindi
guitar
:::

## Reading

:::now-reading
var(--acc) | Database Internals | Alex Petrov | ch. 4 of 14 — B-tree internals
var(--purple) | Rust Atomics and Locks | Mara Bos | finished — reference
:::

## Fitness

Calisthenics three times a week — working towards a clean muscle-up. Running 5K twice a
week for baseline cardio. No gym, bodyweight only.

:::now-chips
calisthenics
running
:::

## Not doing

Not doing freelance work. Not doing hackathons or side projects outside the portfolio.
Not on social media other than GitHub. Focused mode until the three case studies ship.
"#;

const ABOUT_MD: &str = r#"Backend & distributed-systems engineer working mostly in **Rust**. I like things
that are fast, correct, and a little over-engineered.

I write about systems programming, distributed systems, and security — and hunt
bugs in my spare time.

:::timeline
2026 genuine.dev — built this site, started writing weekly.
2025 NotiQ — distributed notification platform in Rust.
2024 Bug bounty — first valid SSRF report, hooked since.
2023 Systems deep-dive — started learning OS internals and concurrency.
:::

## Currently

Mastering full-stack Rust by building everything myself. See the projects section
for what's live.

### Focus areas

- **Systems programming** — lock-free concurrency, memory models, OS interfaces
- **Distributed systems** — consensus, gossip, consistent hashing, backpressure
- **Offensive security** — SSRF, IDOR, logic bugs; active bug-bounty hunter
"#;
