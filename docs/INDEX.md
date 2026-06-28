# genuine.dev — documentation index

Entry point for the project. Everything you need to understand, run, and continue
the project lives in this `docs/` folder. **Last updated: 2026-06-28.**

> **Project status: ✅ MVP COMPLETE & deploy-ready.** Write posts in the browser,
> public themed responsive site, search, RSS/sitemap, newsletter. See
> [CHANGELOG.md](CHANGELOG.md) for what's built and [BUILD-STATE.md](BUILD-STATE.md)
> for resume notes. Post-MVP work (NotiQ block system, real email provider, theme
> presets) is in [ROADMAP.md](ROADMAP.md).

## What this project is
A Rust full-stack **portfolio + technical blog**, built as a **DB-backed CMS**.
You author posts in a browser admin (Postgres is the single source of truth). The
MVP ships live to a VPS and lets you write and publish posts. Long-term it grows
into a feature-rich CMS (rich embeds, theming, comments, AI, more — see roadmap).

## Documentation map
| Doc | What it's for |
|---|---|
| [ROADMAP.md](ROADMAP.md) | **The plan.** Tech stack, architecture, DB model, hosting, MVP milestones, post-MVP phases, theming, DevOps, extensibility. Start here. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | **Living architecture.** System / layer / flow / ER diagrams (Mermaid) + the decision log (ADRs). Kept in sync with the code. |
| [REACT-MIGRATION.md](REACT-MIGRATION.md) | **Active plan (ADR-013).** Split to Rust JSON API + React/Next/TS frontend. Architecture, API endpoints, phases M1–M7. |
| [PHASE4-UI-PARITY.md](PHASE4-UI-PARITY.md) | UI/UX target (the `ui_mockups.html` features) — now built on React per the migration plan. |
| [CHANGELOG.md](CHANGELOG.md) | Dated timeline of everything added to the project. |
| [ui_mockups.html](ui_mockups.html) | Interactive UI/UX mockups — all screens, light/dark + theme presets + per-topic accents. Open in a browser. |
| [notiq_portfolio.html](notiq_portfolio.html) | The design-system source (colors, type, components) and the first project case study. |
| [`../CLAUDE.md`](../CLAUDE.md) | Coding conventions, architecture rules, project structure, self-review + documentation discipline. |

## How to pick this up later (onboarding)
1. **Read** [ROADMAP.md](ROADMAP.md) §1–§9 (decisions → MVP milestones) and
   [`../CLAUDE.md`](../CLAUDE.md) (how the code is organized and written).
2. **Skim** [CHANGELOG.md](CHANGELOG.md) to see what's been built and when.
3. **Open** [ui_mockups.html](ui_mockups.html) to see the target UI.
4. **Build / run** — see below.

### Prerequisites
- Rust 1.93+ (edition 2024) + `rustup target add wasm32-unknown-unknown`
- `cargo install cargo-leptos --locked`
- Docker + Docker Compose (for Postgres). `sqlx-cli` optional (migrations run on startup).

### Run locally
```bash
docker compose up -d        # Postgres (folio/folio @ localhost:5432)
cargo leptos watch          # build + hot-reload → http://127.0.0.1:3000
```
- Migrations run automatically on startup; dev seeds sample content.
- **Admin:** http://127.0.0.1:3000/admin/login — dev credentials `admin` / `admin`.
  Write a post: `/admin/new` → fill title + markdown → status `published` → Save.
- Quality gate: `cargo fmt --all` · `cargo clippy --no-default-features --features ssr -- -D warnings` · `cargo test --no-default-features --features ssr`

### Deploy to production (single VPS)
1. **Image:** CI (`.github/workflows/deploy.yml`) builds and pushes to GHCR on every
   push to `main`. Set the `app.image` in `docker-compose.prod.yml` to your GHCR path.
2. **On the VPS:** copy `docker-compose.prod.yml` + `Caddyfile` + a host `.env` with:
   `POSTGRES_PASSWORD`, `SITE_URL=https://yourdomain`, `DOMAIN=yourdomain`,
   `ADMIN_USERNAME`, `ADMIN_PASSWORD` (required — no prod default). Optional
   `UPLOAD_DIR` (default `./uploads`) — **mount it as a persistent volume** and
   route `/uploads/*` to the backend in the `Caddyfile` (alongside `/api`) so
   uploaded images survive redeploys.
3. **DNS:** point an A record at the VPS. Caddy auto-provisions TLS for `$DOMAIN`.
4. **Launch:** `docker compose -f docker-compose.prod.yml up -d`. Migrations run on
   startup; the admin user is seeded from `ADMIN_PASSWORD`.
5. **Backups:** cron `scripts/backup.sh` (pg_dump → add an offsite upload).
6. **Real email:** the dev `LogMailer` only logs. Implement a provider `Mailer`
   (Resend/Postmark/SES) and use it in `ui/newsletter.rs` for live sending.

> Publishing workflow: log into `/admin`, write/publish — the post goes live and
> confirmed subscribers are notified. (No git/markdown step; Postgres is the source of truth.)

## MVP at a glance (the near-term goal)
| Phase | Delivers |
|---|---|
| 0 | App foundation — axum, config, tracing, Postgres pool, migrations, `/healthz` |
| 1 | Render pipeline (markdown→HTML, syntect) + `documents`/`tags` schema |
| 2 | Public site — home, blog, post, projects, about, search, feeds, SEO |
| 2.5 | Admin — auth + browser create/edit/publish editor |
| 3 | Deploy — Docker, Caddy/TLS, VPS, CI/CD, backups → **live** |

Full detail and the post-MVP roadmap (Phases 4–12) are in [ROADMAP.md](ROADMAP.md).
