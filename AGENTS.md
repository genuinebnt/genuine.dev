# AGENTS.md — genuine.dev

Guidance for working in this repo. Read alongside `docs/ROADMAP.md` (full plan),
`docs/ui_mockups.html` (UI/UX), and `docs/notiq_portfolio.html` (design system).

## What this is
A Rust full-stack **portfolio + technical blog**, built as a **DB-backed CMS**.
Authoring is **browser-admin only** (Postgres is the single source of truth — no
git/file content ingest). MVP ships live to a VPS and lets the owner write posts.

## Tech stack (MVP)
**Full Leptos (SSR + hydration)** on `axum`, built with `cargo-leptos` ·
`leptos_router` · `leptos_meta` · `tokio` · `sqlx` + Postgres · `comrak` +
`syntect` · `tower`/`tower-http` · `tracing` · `thiserror` · `figment` ·
`argon2` + `tower-sessions` · email provider/`lettre`. Rust **edition 2024**.

- **Frontend = Leptos** (ADR-009, reversed from maud+HTMX). `#[server]` functions
  bridge UI ↔ application layer; keep them thin (no business logic in components/server fns).
- CSS-variable theming (light/dark + presets + per-topic accents).
- MVP includes auth + browser editor (Phase 2.5) and newsletter (Phase 2.7).

## Architecture — hexagonal (ports & adapters)
Dependencies point **inward**. Keep business logic free of framework/IO types.

```
web (axum + maud)  ─inbound adapter─▶  application (use cases)  ─▶  domain (pure)
                                              │ ports (traits)
                       infrastructure (sqlx, storage, render) ─outbound adapters─┘
```

- **domain** — entities, value objects, invariants. No `sqlx`, no `axum`, no IO.
- **application** — use cases orchestrating domain + ports (`PublishPost`, `RenderDocument`).
- **infrastructure** — concrete adapters implementing the ports.
- **web** — Leptos components + `#[server]` functions; thin, maps UI ↔ application only.

**Define ports (traits) at the known seams**, each with one impl now and a planned
second later: `ContentRepository`, `Renderer`, `StorageBackend`, `SearchBackend`,
`AuthProvider`, `ThemeProvider`. Don't abstract elsewhere until a second impl is
real (rule of three).

Start as a single binary with module boundaries mirroring the layers; promote to a
Cargo **workspace** (crates: `domain`, `app`, `infra`, `web`, `bin`) once boundaries
stabilize — the graph must forbid `domain` importing `infra`.

## Project structure
```
src/
  main.rs            # wiring: config, tracing, pool, router, shutdown
  config.rs          # typed Config (figment: defaults → file → env)
  error.rs           # top-level error → IntoResponse
  domain/            # entities, value objects (DocumentId, Slug), invariants
  app/               # use cases + port traits
  infra/             # sqlx repos, render service, storage, auth adapters
  web/               # routes, handlers, middleware, extractors
  views/             # maud: layout, components, pages
migrations/          # sqlx migrations
static/              # css, js (htmx), fonts
```

## Coding conventions
Code must be readable by a human picking it up cold (the MVP is AI-built; it must
not create friction when the owner learns/extends it later).

- **rustfmt + clippy clean** — `cargo clippy -- -D warnings` must pass.
- **Self-documenting names.** Functions/types/variables read like prose. No
  Hungarian notation, no abbreviations that aren't idiomatic.
- **Comments explain *why*, never *what*.** No comments that restate the code.
  Comment only non-obvious decisions, invariants, edge cases, or links to context.
- **`///` doc comments on public items** (modules, types, public fns) — concise,
  state intent/usage, not implementation.
- **Errors:** `thiserror` typed enums per layer; propagate with `?` + `From`; map
  to HTTP **only at the web edge** via `IntoResponse`. `anyhow` only in `main`/bins.
- **Type-driven domain:** newtype IDs / value objects validated on construction
  ("parse, don't validate"). Don't pass bare `String`/`Uuid` where meaning matters.
- **Dependency injection** via traits + `AppState` (`Arc<dyn Port>`). No globals,
  no singletons. Constructors take ports so tests inject fakes.
- **No leaking infrastructure types** (`PgRow`, `aws_sdk_*`, `sqlx` rows) past the
  adapter layer. Convert at the boundary with `From`/`TryFrom`.
- **Small, single-responsibility functions;** prefer composition over deep nesting.
- **Async hygiene:** no blocking calls in async; structured concurrency;
  `CancellationToken` for graceful shutdown.
- **SQL:** `sqlx` **runtime-checked** queries (`query`/`query_as` with `FromRow`),
  *not* the compile-time `query!` macros — they couple builds to a live DB and slow
  iteration (ADR-011). Correctness comes from **integration tests** (`testcontainers`)
  on the repository, not the compiler. Versioned migrations.
- **Module hygiene:** `pub(crate)` by default; a small `prelude` for common imports;
  `#[cfg(feature)]` to gate optional capabilities and keep MVP builds lean.

## Testing — quality over quantity
Test what has real risk; skip what the compiler or framework already guarantees.

**Worth testing** (write these):
- Domain invariants & value-object parsing (`Slug`, `DocumentId` — valid/invalid).
- Use-case logic with branches (publish/draft rules, slug uniqueness, auth checks).
- Rendering edge cases (`Renderer`: code highlighting, directives, malformed input).
- Repository queries with real behavior (filters, pagination, FTS) — `testcontainers`.
- Anything with a non-obvious contract or a bug that would be costly/silent.

**Not worth testing** (skip these):
- Getters/setters, trivial mappings, `From`/`Into` with no logic.
- Framework behavior (axum routing, serde derives) — that's not our code.
- Things the type system already enforces.

**How:**
- Tests are **self-explanatory**: the name states the scenario + expectation
  (`rejects_slug_with_uppercase`, `publish_sets_published_at`). Arrange-act-assert,
  minimal setup, one behavior per test.
- Unit tests use **trait fakes** (fast, no IO) for domain/app; integration tests
  use **`testcontainers`** (Postgres) for repos/handlers; `insta` snapshots for
  rendered `maud` views where the output is worth pinning.
- A handful of meaningful tests beats a wall of shallow ones. If a test only
  restates the implementation, don't write it.

## Avoid
- Microservices (this app is a modular monolith — the *NotiQ project* is the
  microservices showcase, not this codebase).
- Abstractions with one impl and no roadmap reason (premature generalization).
- Comments that narrate obvious code; dead code; `unwrap()`/`expect()` outside
  tests and startup wiring.

## Workflow
- Don't `git commit`/`push` unless asked. If on `main`/`master`, branch first.
- Before declaring work done: `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test`.
- Keep new code consistent with surrounding style (comment density, naming, idiom).

## Problem-solving — root cause over workarounds
- **Don't patch around a problem** when fixing the actual source is cleaner. If a
  change is turning hacky or complex, stop and ask: would adjusting an adjacent
  area — a type, a function signature, a boundary, the schema — make this simple?
- Optimize for **the design that's easiest to reason about**, not the smallest local
  diff. A larger change that simplifies the whole is better than a small one that
  adds complexity.
- No special-cases/flags bolted on to avoid a refactor the situation actually calls
  for. Refactor, keep it clean, update the docs/diagrams.

## Self-review (mandatory before declaring any code done)
Reassess every piece of code written, against this checklist:
1. **Correct** — does what's intended; edge cases and error paths handled.
2. **Idiomatic** — passes fmt + clippy; uses the patterns in this file.
3. **Clear** — self-documenting names; no comment restates code; `why`-only comments.
4. **Right layer** — no infra types leaking; logic in domain/app, not handlers.
5. **Simple** — no premature abstraction; smallest design that fits the roadmap.
State briefly what was reviewed and any trade-offs taken.

## Documentation discipline (keep `docs/` a complete handoff package)
The owner must be able to pick this repo up cold and run/understand it from `docs/`.
- **Log every addition** in `docs/CHANGELOG.md` — dated entry (newest first),
  one line per meaningful change (what + why). Use the real date.
- **Keep `docs/INDEX.md` current** — the entry point: doc map, project status,
  and the "when you pick this up" setup/run/deploy guide. Update it as the build
  progresses (fill the Setup/Run/Deploy sections during Phases 0 and 3).
- **Keep `docs/ARCHITECTURE.md` in sync** — any change to structure, boundaries,
  ports, or the **database schema** updates its diagrams (system / layer / flow /
  ER, in Mermaid) and **decision log** in the *same* change. Diagrams must never
  drift from the code. New architectural decisions = a new dated ADR row (mark the
  superseded one ⛔, don't rewrite history).
- New subsystems get a short doc in `docs/` when they're non-obvious; link it
  from `docs/INDEX.md`.
