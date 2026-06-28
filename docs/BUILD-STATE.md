# Build state — resume here

Living "where we are" doc so work can resume mid-build (e.g. after a token reset).
Update this whenever a step completes. **Last updated: 2026-06-27.**

## Current position — 🔄 RE-ARCHITECTING to React/Next + Rust JSON API (ADR-013)
- The **Leptos MVP was fully built & verified** (Phases 0–3) — but we're now splitting
  into a **Rust axum JSON API (`backend/`) + React/Next.js/TS frontend (`frontend/`)**,
  JWT auth. Reason: Leptos pre-1.0 stability + React ecosystem (esp. WYSIWYG). All
  Rust domain/infra/repo/render/auth/mailer/subscribers/migrations is **reused**.
- **The plan is `docs/REACT-MIGRATION.md`** (architecture, API endpoints, phases M1–M7).
- **M1 ✅ DONE & verified** — backend is now a Rust axum JSON API (`src/api/`) with JWT.
  Leptos stripped; all domain/infra reused. Old Leptos UI kept at `reference/leptos-ui/`.
  Run: `docker compose up -d && cargo run` → API at `http://127.0.0.1:3001`
  (`/healthz`, `/api/posts`, `/api/posts/:slug`, `POST /api/auth/login`, `/api/admin/docs`
  [Bearer], `POST /api/newsletter/subscribe`, `/feed.xml`, `/sitemap.xml`).
- **M2 ✅ DONE & verified** — `frontend/` = Next.js 15 + React 19 + TS. API client
  (`lib/api.ts`), Nav/Footer, layout (fonts + theme boot), home + post pages SSR-fetching
  the API, NotiQ SCSS ported. `next build` green; home + `/blog/:slug` verified against
  the live API.
- **Run both (dev):** terminal 1 `docker compose up -d && cargo run` (API :3001);
  terminal 2 `cd frontend && npm run dev` (Next :3000). `frontend/.env.local` →
  `NEXT_PUBLIC_API_URL=http://127.0.0.1:3001`.
- **M3–M7 ✅ DONE.** React/Next + Rust API stack at **full feature parity** + deployable:
  public pages (SSR), client search, 5-preset theming + accent picker, **JWT admin**
  (login/dashboard/editor/delete), newsletter form, **Cmd-K** palette.
- **Backend restructured + clean code:** `backend/` crate; `telemetry.rs`; `AppError`
  (infra) + **`ApiError`** (web, `IntoResponse`); `server.rs` clean `Result` bootstrap;
  `api/{mod,error,auth,content,admin,newsletter,feeds}`. fmt+clippy clean, 6 tests, smoke green.
- **Deploy artifacts (M7) written:** `backend/Dockerfile` (plain `cargo build`),
  `frontend/Dockerfile` (Next standalone), `docker-compose.prod.yml` (postgres+backend+
  frontend+caddy), `Caddyfile` (routes `/api`,`/feed.xml`,`/newsletter/*`,`/healthz` →
  backend; rest → frontend), CI (backend + frontend jobs; deploy builds both images).
- **Run (dev):** `cd backend && cargo run` (:3001) + `cd frontend && npm run dev` (:3000);
  admin `/admin/login` (`admin`/`admin`). **Prod:** set host `.env` (POSTGRES_PASSWORD,
  SITE_URL, DOMAIN, JWT_SECRET, ADMIN_*) → `docker compose -f docker-compose.prod.yml up -d --build`.
- **2026-06-28 UI parity pass completed**: all public pages now match `docs/mockups/ui-ux-mockup.html` — feat-card home, two-column writing index (wri-shell), two-column projects (projects-shell), post-shell post detail with TOC kv-pairs + art-* classes, admin stat cards + post table, topic colour bars throughout, nav updated to `genuine.dev` logo + ⌘K kbd hint + admin pill.
- **2026-06-28 Out-of-scope items completed**: (1) Backend prev/next adjacent post navigation in `PostDetail` API response; `DocArticle` uses real prev/next links. (2) Admin editor refactored to 3-panel shell per mockup — file tree (fetches admin list, grouped by kind) | TipTap editor (tab bar + status bar) | tabbed sidebar (Meta/Outline/Diagnostics). (3) `/admin/settings/theme` page: 5 preset cards, accent swatches + custom picker, live preview, per-page override table, save to localStorage.
- **Remaining polish:** full ARCHITECTURE diagram refresh (hexagonal/ER/sequence still describe Leptos web layer), and an actual `docker compose build` + VPS deploy run (yours).

### Done (Phase 2a)
- Full NotiQ design tokens (dark + light) ported into `style/main.css` + components
  (nav, hero, post rows, project cards, prose/code, footer) + responsive +
  `prefers-reduced-motion`.
- `ui/components.rs`: `SiteHeader` (logo + pill nav with active-section state via
  `use_location`) + `SiteFooter`; wired into `App` layout around the `Routes`.
- **Theme toggle**: no-flash inline `THEME_JS` in the shell `<head>` (applies saved
  theme before paint) + global `__toggleTheme`; header button calls it via a
  wasm-only extern (`#[cfg(feature="hydrate")]`). `[data-theme="light"]` ready.
- Self-hosted-later fonts via Google Fonts link (IBM Plex Mono + Inter).
- Verified: nav + active pill + theme script + hero + footer render; `/blog/:slug`
  article styled. fmt + clippy clean; 6 tests pass; full server+wasm build green.

## Toolchain (verified 2026-06-27)
- Rust 1.93.1 (edition 2024) · wasm32-unknown-unknown ✓ · cargo-leptos ✓
- Docker (OrbStack) ✓ · Postgres 17 running via `docker compose` ✓ · sqlx-cli 0.8.6 ✓
- Resolved: leptos 0.8.14, leptos_axum 0.8.10, axum 0.8.9, sqlx 0.8.6, wasm-bindgen 0.2.126 (auto by cargo-leptos)

## Pinned versions
leptos / leptos_meta / leptos_router / leptos_axum = "0.8" · axum "0.8" · tokio "1" ·
sqlx "0.8" · tower "0.5" · tower-http "0.6" · thiserror "2" · dotenvy "0.15".

## Done (Phase 0)
- Leptos SSR + hydration app on axum (`cargo-leptos`); builds server + WASM.
- Hexagonal layout: `src/{config,error,server}.rs`, `src/infra/db.rs`, `src/ui/app.rs`.
  Server-only modules gated behind `#[cfg(feature = "ssr")]`.
- Config from env (`Config::from_env`), typed errors (`AppError`, thiserror),
  `tracing` structured logs, Postgres pool (`infra::db::connect`), migration runner
  (`sqlx::migrate!("./migrations")`), `/healthz`, graceful shutdown (ctrl_c).
- DB pool injected via Leptos **context** (`provide_context`) — server fns will
  `expect_context::<PgPool>()` from Phase 1. Router state stays `LeptosOptions`.
- `docker-compose.yml` (Postgres), `.env` / `.env.example`, `justfile`, `style/main.css`
  (NotiQ tokens), `public/robots.txt`, `migrations/` (empty; first migration in Phase 1).
- Verified: `/healthz`=ok, "database connected" log, `_sqlx_migrations` table created,
  SSR HTML renders, `cargo fmt` + `clippy -D warnings` clean.

## Done (Phase 1)
- Migration `0001_documents.sql`: `documents` + `tags` + `document_tags` (+ generated
  `search_tsv` tsvector, GIN index). Applied automatically on startup.
- **domain** (`src/domain/`): `Document`, `Kind`, `Status`, `Slug` value object
  (validated; `from_title` slugify) — 4 unit tests.
- **app ports** (`src/app/ports.rs`): `Renderer`, `ContentRepository`, `Rendered`.
- **infra**: `render.rs` `MarkdownRenderer` (comrak GFM + syntect highlighting,
  reading time) — 2 tests; `repo.rs` `PgContentRepository` (sqlx); `seed.rs`
  dev-only sample post (rendered through the real pipeline).
- **ui** (`src/ui/posts.rs`): `PostView`/`PostSummary` DTOs, `get_post`/`list_posts`
  `#[server]` fns, `BlogList` (home `/`) + `PostPage` (`/blog/:slug`) with
  Resource/Suspense; pool reaches server fns via Leptos context.
- Verified end-to-end: seed renders + stores highlighted HTML; `/` lists the post;
  `/blog/:slug` SSR-renders heading + `min read` + highlighted code + prose.
  `fmt` + `clippy -D warnings` clean; 6 tests pass.

### Decisions
- **sqlx queries are runtime-checked** (`query`/`query_as`), *not* compile-time
  `query!` macros — deliberate (ADR-011): macros couple builds to a live DB and slow
  iteration. Correctness comes from integration tests (`testcontainers`) on the repo.
  TODO (testing, not debt): add repo integration tests since the compiler no longer
  checks queries.

## How to run (local dev)
```
docker compose up -d          # start Postgres (folio/folio @ localhost:5432/folio)
cargo leptos serve            # build + run → http://127.0.0.1:3000
# or: cargo leptos watch      # hot reload
curl http://127.0.0.1:3000/healthz   # -> ok
```
fmt/lint/test: `cargo fmt --all` · `cargo clippy --no-default-features --features ssr -- -D warnings`

## Gotchas / decisions
- **Global `DATABASE_URL` shadowed `.env`.** This machine exports
  `postgresql://postgres:password@localhost:5432/blog`. Fixed cleanly: in **debug**
  builds the app uses `dotenvy::dotenv_override()` (project `.env` wins); in **release**
  it uses `dotenvy::dotenv()` (real env vars win — production correctness). See `server.rs`.
- Server-only deps (axum, sqlx, tokio…) are `optional` + gated behind the `ssr` feature,
  or the wasm/hydrate build breaks.

## Next steps (Phase 2b — remaining public site)
1. Repo: `list_published_by_kind(kind)` + `get_published_by_slug` already works for
   any kind. Projects index (`/projects`) + detail (`/projects/:slug`, kind=project),
   About (`/about`, a kind=page doc). Seed a sample project + about page.
2. Feeds + SEO: `/feed.xml` (RSS via an axum route returning XML), `/sitemap.xml`,
   custom 404 view. (`robots.txt` already served from `public/`.)
3. Full-text search (`search_tsv` ready) — a `search(q)` server fn + a search box;
   tag filter (needs `document_tags` reads).
4. Theme presets (midnight/sepia/…) + per-topic accents (`tags.accent`, `data-topic`).
5. Tests: feed/sitemap output shape, search query.

> Note: theme toggle button lives in the nav and calls the global `__toggleTheme`.
> When adding presets, extend that JS + the `[data-theme]` blocks in `style/main.css`.
