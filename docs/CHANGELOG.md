# Changelog — genuine-folio

Dated timeline of everything added to the project. Newest first.
Format: each entry is `what` (+ `why` when not obvious). Planning artifacts and
code changes both go here so the history is complete.

---

## 2026-06-28 — Rich seed content + directive renderer fixes

- **Seed content** (`infra/seed.rs`): 4 blog posts (a 2-part lock-free series, an
  SSRF bug-bounty walkthrough, a `SKIP LOCKED` explainer), 2 projects (the full
  **NotiQ** case study recreating `docs/notiq_portfolio.html` — 8 service cards,
  comm matrix, 5 build-narrative accordions, 5 concept-tab panels, 12 infra grid
  items, 8 design signals — plus genuine-folio), and the About page. All carry
  real metadata (featured / series / tags / tech) and staggered publish dates so
  the homepage, blog index, and project list render naturally.
- **Bugfix — nested directives never rendered:** the renderer's directive scanner
  wasn't depth-aware, so container directives (`cards`, `grid`, `signals`,
  `accordion`, `tabs`) stopped at the *first* inner `:::` — only the first child
  rendered and the rest leaked as raw text. Made `preprocess_directives` +
  `collect_blocks` depth-aware. This is why only single-level directives
  (callout/aside/timeline) had worked.
- **Bugfix — grammar made uniform:** `:::tab` was a bare marker with no closer,
  which broke depth counting and over-consumed following blocks. Tabs are now
  closed `:::tab "label" … :::` blocks (backend `render_tabs`, frontend
  `directives.ts`, seed, insert template all updated) — every directive is now a
  closed block, no special cases.
- **Bugfix — `:::matrix` rendered the table as literal `| … |` text** (comrak
  treated the wrapping `<div>` as a raw HTML block). `render_matrix` now renders
  the markdown table to HTML before wrapping.
- Tests: nested-container, matrix, and code-fence-attr render tests (15 total).

## 2026-06-28 — WYSIWYG editor, image uploads, wider layout

- **Wider layout:** the shared container is now `--shell-w: 1080px` (matches the
  design mockups; was 880px). No-TOC articles (e.g. About) use a centered 760px
  measure via `.article-solo` — fixes a latent bug where they were squished into
  the 200px TOC track.
- **WYSIWYG editor (TipTap → Markdown):** replaced the raw `<textarea>` with a
  rich editor (`components/editor/*`). StarterKit + Image + tables + an attributed
  code block (`filename=`/`highlight=` preserved through the round-trip) + a
  `Directive` node. Content stays **Markdown** so the backend render pipeline is
  unchanged. SSR-safe via `immediatelyRender: false`.
- **Directive blocks as custom nodes (ADR-014 follow-through):** a single
  `Directive` node stores raw `:::` source verbatim (lossless), parsed by a
  depth-aware markdown-it rule. Its React NodeView renders **structured forms** for
  8 families — callout, aside, timeline, cards, grid, signals, accordion, tabs —
  and a raw-source editor for matrix. Idempotent round-trip verified for all.
- **Image upload (new `StorageBackend` port):** `LocalDiskStorage` adapter +
  `POST /api/admin/upload` (JWT-guarded, magic-byte image sniff, 5MB cap) +
  `/uploads/*` static serving + a Next rewrite so paths resolve in dev. Drag/click
  upload in the editor; cover-image upload in the settings panel.
- **Post settings panel:** title, slug, summary, kind, status, **featured**,
  **series** (name + part), **tags**, **tech**, **cover image** — all persisted.
- **Bug fix:** admin `save` previously hardcoded `metadata: {}` / `cover_image:
  None`, **silently wiping** featured/series/tech and cover on every edit. Now
  round-tripped (`EditDoc`/`SaveReq` carry both). Verified end-to-end against PG.
- **UI consistency:** shared `PageHeader`, restyled admin list + login (auth card),
  and an admin-only floating **Edit** button on article pages → the editor.
- **Docs:** `StorageBackend` port added to the hexagonal diagram; ADR-016.

## 2026-06-28 — Phase 4: UI parity, directives, comments & series

- **Block directives (server-rendered):** `:::aside / callout / cards / matrix /
  accordion / grid / signals / tabs / timeline` (+ sub-directives) preprocessed in
  `infra/render.rs` into themed HTML, recreating the NotiQ component library across
  posts and projects. Unknown directives degrade to a blockquote.
- **Attributed code fences:** ```` ```lang filename="…" highlight="1,3-5" ```` now
  highlighted line-by-line with **syntect** directly (added as a direct dep) — line
  numbers (`.ln`), highlighted lines (`.hl`), filename header, and a copy button
  whose raw payload rides in `data-copy` (so line numbers aren't copied). Replaced
  the old post-hoc `wrap_code_blocks` pass.
- **Heading anchors:** comrak `header_id_prefix` enabled so the frontend can build
  an anchored, scroll-spy TOC (`DocArticle` extracts ids from comrak's inner `<a>`).
- **Comments:** migration `0004_comments.sql` (flat, unauthenticated, cascade on
  document delete) + `GET/POST /api/posts/{slug}/comments` + `Comments` client
  component. Chosen over Giscus to stay self-contained (ADR-015).
- **Series & featured:** stored in `documents.metadata` (`featured`, `series`);
  homepage featured grids + `SeriesBanner` on post detail. No schema change (ADR-014).
- **Interactivity:** `DocInteractive` client component owns copy / tabs / accordion
  toggles / scroll-spy; the renderer no longer emits inline `onclick` handlers
  (which previously double-toggled accordions and called an undefined `showTab`).
- **Frontend pages:** homepage hero pills + `.divider5` + `.pcard`/`.proj` grids;
  blog index; project cards; article layout with sticky TOC; about page.
- **Docs:** ER diagram gains `comments`; ADR-014/015 added.

## 2026-06-28 — Cleanup + polish

- **Removed dead Leptos code:** `reference/leptos-ui/` (6 files) + orphaned root
  `style/` and `public/`. The codebase is now just `backend/` (Rust API) + `frontend/`
  (Next.js) + docs/deploy config.
- **Sass tidy:** `@use "sass:map"` + `map.get`, and a `color.change` alpha helper —
  frontend build is now **warning-free**.
- **ARCHITECTURE diagrams refreshed** to the split: system context (frontend + backend
  API + Caddy), hexagonal (web adapter = axum JSON API + SPA client), and both
  request-flow sequences (React SPA → JSON API).
- **Remaining:** NotiQ rich content blocks (roadmap §11); an actual
  `docker compose -f docker-compose.prod.yml build` + VPS deploy run.

## 2026-06-28 — Backend restructure + clean code (during M7)

- **Moved Rust crate into `backend/`** (frontend in `frontend/`). Root: docs, compose,
  Caddyfile, CI, `reference/`, `scripts/`.
- **`telemetry.rs`** (tracing init, split from server). `main.rs` is now tiny
  (telemetry + run). **`server.rs` = clean bootstrap returning `Result`** (no `.expect`
  sprawl): `load_env` → config → db → migrate → seed → `build_router` → serve + shutdown.
- **Two error types:** `AppError` (domain/infra, thiserror) + new **`ApiError`**
  (`api/error.rs`) implementing `IntoResponse` (status + JSON `{error}`); `From<AppError>`
  logs and maps to `Internal`. Handlers now return `Result<_, ApiError>` and use `?` (terse).
- **API modularized:** `api/{mod,error,auth,content,admin,newsletter,feeds}` — feeds
  (health/feed/sitemap) + newsletter confirm/unsubscribe moved out of `server.rs`; full
  router assembled in `api/mod.rs`.
- Verified: fmt + clippy `-D warnings` clean, 6 tests pass, runtime smoke green.
  **Run now: `cd backend && cargo run`.**

## 2026-06-28 — M4 + M5 done: theming + admin (React stack at feature parity)

**M4 — Theming:** `ThemePicker` client component (5 preset swatches + accent color
input + reset) in the nav; layout boot script extended to `__setTheme`/`__setAccent`/
`__resetAccent` (no-flash, persisted). SCSS already had all `[data-theme]`/`[data-topic]`
blocks. Verified: swatches + accent + boot fns render.

**M5 — Admin (JWT):** `lib/auth.ts` (login → token in `localStorage`; `authed()` adds
Bearer; admin list/get/save/delete). Pages `/admin/login`, `/admin` (dashboard),
`/admin/new`, `/admin/edit/[slug]` (client components); shared `EditorForm`.
- **Verified e2e:** `/admin/login` renders; login → `POST /api/admin/docs` (204) →
  the new post appears on `/api/posts`. `next build` green (all admin routes).
- Note: token in `localStorage` (XSS tradeoff) — harden later with httpOnly refresh cookie.

**The React/Next + Rust API stack now has full parity with the old Leptos MVP:**
browse · search · theme · **write posts from the browser**. Next: M6 (newsletter UI,
Cmd-K, NotiQ blocks), M7 (deploy).

## 2026-06-28 — M3 done: full public site in React/Next (SSR from API)

- Pages: `/projects` (cards), `/projects/[slug]`, `/about` — all SSR via `getProjects`/
  `getDoc`. Shared `DocArticle` component (post/project/about reuse it).
- **Client search:** `PostSearch` (client component) + `PostRows`; `searchPosts(q)` →
  `/api/search`. Home SSR-renders the initial list, client filters live.
- Verified: `next build` green (5 routes); `/projects` lists NotiQ, `/projects/notiq`
  + `/about` render, search source returns results.
- Note: sass `map-get`/`rgba` deprecation **warnings** (non-blocking) — tidy in M7
  (`@use "sass:map"`/`map.get`).
- **Next: M4** — theming (presets + accent picker + per-topic) in React.

## 2026-06-28 — M2 done: Next.js + TS frontend scaffold (SSR from the API)

- `frontend/` — Next.js 15 (App Router) + React 19 + TypeScript. `npm install` + build OK.
- `lib/api.ts` (typed API client), `components/{Nav,Footer}.tsx`, `app/layout.tsx`
  (fonts + no-flash theme boot + toggle), `app/page.tsx` (home), `app/blog/[slug]/page.tsx`.
- `styles/globals.scss` — NotiQ tokens/theme ported (5 theme maps + 6 topic accents via
  `@each`), compiled by Next's sass.
- **Verified end-to-end:** `next build` typechecks/compiles; with backend (:3001) + `next dev`
  (:3000), the **home SSR-renders the post list fetched from the Rust API**, and
  `/blog/:slug` renders the post with syntect-highlighted HTML. (M2 also covers the
  home + post pages from M3.)
- **Next: M3** — projects, project detail, about, search pages.

## 2026-06-28 — Pivot to React/Next + Rust JSON API (ADR-013); M1 done

- **Decision:** Leptos (pre-1.0) → **Rust axum JSON API + React/Next.js/TS frontend**,
  JWT auth. Plan in `docs/REACT-MIGRATION.md`. Leptos UI preserved under
  `reference/leptos-ui/` (not compiled).
- **M1 — Backend → JSON API (done & verified):**
  - Cargo.toml de-Leptos'd (removed leptos*/wasm-bindgen/cargo-leptos/features; plain
    binary crate); added `jsonwebtoken`; dropped `tower-sessions`.
  - New `src/api/` (axum JSON): `content` (posts/projects/pages/search), `auth` (JWT
    login + `AuthUser` Bearer extractor + `/me`), `admin` (CRUD, JWT-guarded),
    `newsletter` (subscribe). `server.rs` rewritten as plain axum (`/api` nested +
    feed/sitemap/confirm/unsubscribe), CORS for dev, binds `BIND_ADDR` (default :3001).
  - Reused unchanged: `domain/`, `infra/` (repo, comrak+syntect render, argon2 auth,
    mailer, subscribers + new `notify_new_post`), config, migrations.
  - **Verified via curl:** `/api/posts`, `/api/posts/:slug` (highlighted html), JWT
    login → token, admin 401-without/200-with-token, newsletter subscribe, feed.xml.
    fmt + clippy clean; 6 tests pass.
- **Next: M2** — scaffold the Next.js + TS frontend.

## 2026-06-28 — Phase 2.7 (Newsletter) + Phase 3 (Deploy) — 🎉 MVP COMPLETE (Leptos)

**Phase 2.7 — Newsletter**
- Migration `0003_subscribers.sql`; `Mailer` port + `LogMailer` (dev: logs the email;
  swap a provider for real sending).
- `infra/subscribers.rs` (subscribe / confirm / unsubscribe / list_confirmed), double opt-in.
- `ui/newsletter.rs`: `subscribe` server fn + `SubscribeForm` (in the footer) + `notify_new_post`.
- Confirm/unsubscribe axum routes; **email-on-publish** wired into `save_doc`.
- Verified e2e: subscribe → confirm link logged → confirmed in DB; publishing a post
  emails the confirmed subscriber (logged).

**Phase 3 — Deploy artifacts**
- `Dockerfile` (multi-stage: `cargo leptos build --release` → `debian-slim` non-root runtime).
- `docker-compose.prod.yml` (app + postgres + caddy), `Caddyfile` (auto-TLS + security
  headers), `.dockerignore`, `scripts/backup.sh` (pg_dump), GitHub Actions `ci.yml`
  (fmt/clippy/test w/ postgres) + `deploy.yml` (build → GHCR; SSH deploy stub).
- **Verified:** release binary builds (server + wasm) and **serves correctly with the
  Docker-style `LEPTOS_*` env** — healthz, home, post page, and `/pkg` wasm+css all 200.
  (Full image build is ~15 min due to `cargo install cargo-leptos`; run via CI/locally.)

**MVP COMPLETE** — write posts in the browser · themed responsive public site · search ·
RSS/sitemap · newsletter · deploy-ready. Remaining to actually go live: set prod env
(`ADMIN_PASSWORD`, `SITE_URL`, `DOMAIN`, `POSTGRES_PASSWORD`), point DNS, `docker compose
-f docker-compose.prod.yml up -d`. For real emails, implement a provider `Mailer`.

## 2026-06-28 — Phase 2.5 complete (Admin auth + browser editor) ⭐

MVP core goal met: **posts can be written from the browser.**
- Migration `0002_users.sql`; `infra/auth.rs` (argon2 hash/verify, admin seed —
  `ADMIN_PASSWORD` required in prod, `admin/admin` in dev).
- Sessions via `tower-sessions` `MemoryStore` + `SessionManagerLayer`. Server-fn
  DB access switched to `Extension`-extracted pool (robust for POST + SSR).
- Repo: `upsert` (insert-or-update by slug), `delete`, `list_all`, `get_by_slug`.
- `ui/admin.rs`: `login`/`logout`/`list_admin`/`get_edit`/`save_doc`/`delete_doc`
  server fns (auth-guarded via `require_admin`); `LoginPage`, `AdminDashboard`,
  `EditorPage`/`EditorForm` (title/slug/summary/kind/status + markdown). Routes
  `/admin/login`, `/admin`, `/admin/new`, `/admin/edit/:slug`.
- **Verified end-to-end via curl:** login sets session + redirects; `/admin` guarded;
  wrong password rejected; **created a post through the editor → it renders on the
  site with syntax highlighting.** fmt + clippy clean; 6 tests pass; full build green.
- Note: sessions are in-memory (lost on restart — fine for single-admin MVP);
  swap to a Postgres session store later if desired.

## 2026-06-28 — Phase 2b (projects, about, feeds, search)

- Repo: `list_published_by_kind`, `search_published` (tsvector + `plainto_tsquery`).
- UI: `ProjectsList` (`/projects`), `DocPage` (shared for `/blog/:slug` and
  `/projects/:slug`), `AboutPage` (`/about`), styled 404 fallback, and a reactive
  search box on the home page (`search_posts` server fn).
- Feeds/SEO: `/feed.xml` (RSS) and `/sitemap.xml` axum routes (pool via `Extension`),
  base URL from `SITE_URL`. Seed now adds a project (`notiq`) + about page.
- Verified: all pages render, feed/sitemap valid. fmt + clippy clean; 6 tests pass.
- Deferred to post-MVP polish: theme presets + per-topic accents (light/dark works).

## 2026-06-28 — Decision: runtime-checked sqlx (ADR-011)

- Keep sqlx **runtime-checked** queries; drop the plan to adopt compile-time
  `query!` macros — they couple builds to a live DB and slow iteration. This is now
  a decision, not tech-debt. Updated CLAUDE.md SQL convention + ARCHITECTURE ADR-011.
- New follow-up (testing): add repository integration tests (`testcontainers`),
  since the compiler no longer verifies queries.

## 2026-06-28 — Phase 2a (Design system + nav + theming)

The site now wears the NotiQ brand with working navigation and theming.
- Ported full NotiQ tokens (dark + light) + components into `style/main.css`
  (nav, hero, post rows, project cards, prose/code, footer); responsive +
  reduced-motion.
- `ui/components.rs`: `SiteHeader` (logo + pill nav, active-section state via
  `use_location`) + `SiteFooter`, wired into the `App` layout.
- No-flash theme toggle: inline `THEME_JS` in shell `<head>` + global
  `__toggleTheme`; header button calls it via a wasm-only extern. `[data-theme=light]` ready.
- Verified: nav/active pill/theme script/hero/footer render; article styled.
  fmt + clippy clean; 6 tests pass; full build green.
- Remaining Phase 2 (→ 2b): projects/about pages, RSS/sitemap/404, search, theme presets.

## 2026-06-28 — Phase 1 complete (Render pipeline + schema + first page)

The render pipeline is live and content shows on the site.
- **Migration 0001:** `documents` + `tags` + `document_tags` (+ generated `search_tsv`
  tsvector + GIN index). Runs on startup.
- **domain:** `Document`/`Kind`/`Status` + `Slug` value object (validated, `from_title`).
- **app ports:** `Renderer`, `ContentRepository`, `Rendered`.
- **infra:** `MarkdownRenderer` (comrak GFM + syntect highlighting + reading time),
  `PgContentRepository` (sqlx), dev-only `seed_if_empty` (renders a real sample post).
- **ui:** `get_post`/`list_posts` `#[server]` fns + `BlogList` (`/`) and `PostPage`
  (`/blog/:slug`) via Resource/Suspense; DB pool reaches server fns through Leptos context.
- **Verified:** seed stores syntect-highlighted HTML; home lists the post; `/blog/:slug`
  SSR-renders heading + reading time + highlighted code + prose. 6 tests pass; fmt + clippy clean.
- **Tech-debt logged:** sqlx queries are runtime-checked for now (not compile-time
  `query!` macros) — see `docs/BUILD-STATE.md`.

## 2026-06-27 — Phase 0 complete (Foundation)

First application code. Leptos SSR + hydration app on axum, built with `cargo-leptos`.
- **Scaffold:** hexagonal layout — `config.rs`, `error.rs` (thiserror), `infra/db.rs`
  (Postgres pool + `sqlx::migrate!` runner), `server.rs` (router, tracing, graceful
  shutdown), `ui/app.rs` (Leptos shell + App + hydration). Server-only modules gated
  behind `#[cfg(feature = "ssr")]`.
- **Wiring:** `/healthz`; DB pool injected via Leptos `provide_context` (router state
  stays `LeptosOptions` — avoids a premature custom `AppState`); structured `tracing`.
- **Infra:** `docker-compose.yml` (Postgres 17), `.env`/`.env.example`, `justfile`,
  `style/main.css` (NotiQ tokens), `public/robots.txt`.
- **Fix:** global `DATABASE_URL` shadowed `.env`; resolved with debug-only
  `dotenv_override` (prod keeps real-env precedence). Root-cause, not a workaround.
- **Verified:** healthz ok, DB connected + `_sqlx_migrations` created, SSR renders,
  full server+WASM build green, `fmt` + `clippy -D warnings` clean.
- Versions resolved: leptos 0.8.14, axum 0.8.9, sqlx 0.8.6, wasm-bindgen 0.2.126.
- Resume notes in `docs/BUILD-STATE.md`.

## 2026-06-27 — Stack reversal + newsletter in MVP

- **Frontend → full Leptos (SSR + hydration) on axum** (ADR-009, ⛔ supersedes
  ADR-001 maud+HTMX). Reason: one cohesive Rust full-stack, no later view-system
  migration, fits the heavy interactive/theming roadmap. Costs accepted (steeper
  start, smaller ecosystem). Updated: ROADMAP §1/§2/§5/§6/§8/§13, ARCHITECTURE
  diagrams + ADRs, CLAUDE.md, memory.
- **Newsletter pulled into the MVP** (ADR-010) — new **Phase 2.7**: subscribers +
  double opt-in + email-on-publish via a transactional provider (`Mailer` port).
  Added `subscribers` table to the data model.
- MVP scope now: write posts (browser editor) · subscribers emailed on publish ·
  full themed responsive UI/UX · auth · deploy live.

## 2026-06-27 — Planning & design (no application code yet)

**Decisions locked**
- Stack: `axum` + `maud` (server-rendered) + HTMX + `sqlx`/Postgres. **No Leptos
  in MVP** (post-MVP, islands-only) — keeps the MVP on the backend-learning track.
- Authoring: **DB-backed CMS, browser-admin only.** Dropped the git/file markdown
  ingest — Postgres is the single source of truth.
- Hosting: single VPS (Hetzner/DO) + Caddy (auto-TLS) + docker-compose + GitHub Actions CD.
- MVP scope pulled a slice of Phase 5 forward: **minimal auth + browser editor**
  (markdown + HTMX preview) so posts can be authored in the browser at launch.
- Architecture: modular monolith, hexagonal (ports & adapters). Not microservices.

**Documents created**
- `docs/ROADMAP.md` — full plan (14 sections): decisions, design system, content
  pipeline, DB model, tech stack, project structure, hosting, MVP milestones
  (Phases 0–3 incl. 2.5 admin), post-MVP plan (Phases 4–12), rich-content
  capability matrix, theming system (light/dark + presets + per-topic accents),
  DevOps & CI/CD, architecture & extensibility, fasterthanlime-inspired ideas,
  and the rich-content end-goal (block/directive registry).
- `docs/ui_mockups.html` — interactive UI/UX mockups: 8 screens (home, blog, post,
  projects, project detail, about, Cmd-K, design system), 5 theme presets + custom
  accent picker + per-topic accents, pill-style nav with active state. Typography
  aligned exactly to `docs/notiq_portfolio.html` (weight 500, Plex Mono + Inter).
- `docs/notiq_portfolio.html` — design-system source + first project case study
  (pre-existing; the visual theme everything derives from).
- `CLAUDE.md` — coding conventions, hexagonal architecture, project structure,
  self-review checklist, and documentation discipline.
- `docs/INDEX.md` — documentation entry point / handoff guide.
- `docs/CHANGELOG.md` — this file.
- `docs/ARCHITECTURE.md` — living architecture: Mermaid diagrams (system, hexagonal
  layers, request flows, ER) + ADR decision log. Kept in sync with the code.

**Conventions added to `CLAUDE.md`**
- Self-review checklist before any code is declared done.
- Root-cause-over-workarounds: prefer simplifying adjacent code over local hacks.
- Documentation discipline: update CHANGELOG, INDEX, and ARCHITECTURE (diagrams +
  ADRs) in the same change; never let diagrams drift from code.
- Testing philosophy: quality over quantity — test real risk (invariants, use-case
  branches, render edge cases, repo queries); skip trivial/framework-guaranteed
  cases; tests must be self-explanatory.

**Roadmap additions**
- **Project case-study system** (ROADMAP §11): NotiQ's elements (architecture/ER
  diagrams, service cards, comm matrix, accordions, tabs, grids, decision lists)
  become a **reusable block/directive library** so any new project page is composed
  from them — never bespoke per-project HTML. Basic project pages in MVP (Phase 2);
  full block library in Phase 4. ADR-007.
- **Responsive / mobile-first** (ROADMAP §2, Phase 2, capability matrix): excellent
  mobile reading is an **MVP requirement** — fluid layout, collapsing nav, mobile
  TOC, scrollable code/tables, responsive images, reduced-motion. ADR-008.
- **New post-MVP phases (over-engineering, web-inspired)** — ROADMAP §10:
  - **Phase 13 — Digital garden & knowledge graph:** bidirectional `[[links]]`,
    backlinks, internal-link hover previews, growth stages, `note`/TIL kind, graph view.
  - **Phase 14 — Reader experience & delight:** reader prefs, focus mode, TTS,
    highlight-to-share, keyboard nav, interactive explorables, tasteful whimsy,
    in-browser terminal + `curl` content-negotiation access.
  - **Phase 15 — Personal data pages:** `/colophon`, `/uses`, `/now`, `/bookshelf`,
    `/changelog`, writing-stats dashboard, image power-blocks (comparison slider, etc.).
  - Mastery map extended; inspiration sources recorded (Josh Comeau, Ciechanowski,
    Maggie Appleton, Andy Matuschak, antfu, Tufte/Obsidian/IndieWeb). Note: live web
    search was rate-limited; drew on known sites — revisit with fresh search later.

**Status:** planning complete. Application code not started (Phase 0 next).
