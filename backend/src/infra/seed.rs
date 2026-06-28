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
        json!({ "featured": true, "tags": ["security", "bug-bounty"] }),
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
        json!({ "tags": ["postgres", "systems"] }),
        33,
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
        Some("From-scratch relational DBMS in Rust — buffer pool, B+ tree, executors, transactions."),
        DB_LABS_MD,
        json!({
            "featured": true,
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
        id: existing
            .as_ref()
            .map(|d| d.id)
            .unwrap_or_else(Uuid::now_v7),
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
