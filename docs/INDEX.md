# genuine.dev — documentation index

Entry point for the project. Everything you need to understand, run, and continue
the project lives in this `docs/` folder. **Last updated: 2026-06-28.**

> **Project status: ✅ MVP COMPLETE.** React/Next frontend + Rust JSON API. Write in
> the browser admin; Postgres is source of truth. See [BUILD-STATE.md](BUILD-STATE.md)
> for resume notes and [ROADMAP.md](ROADMAP.md) §9 for the over-engineering plan
> (what's shipped vs what's next).

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
| [REACT-MIGRATION.md](REACT-MIGRATION.md) | **Migration record (ADR-013).** Leptos → Rust JSON API + React/Next. M1–M7 ✅ complete. |
| [PHASE4-UI-PARITY.md](PHASE4-UI-PARITY.md) | UI/UX target (the `ui_mockups.html` features) — now built on React per the migration plan. |
| [CHANGELOG.md](CHANGELOG.md) | Dated timeline of everything added to the project. |
| [ui_mockups.html](ui_mockups.html) | Interactive UI/UX mockups — all screens, light/dark + theme presets + per-topic accents. Open in a browser. |
| [notiq_portfolio.html](notiq_portfolio.html) | The design-system source (colors, type, components) and the first project case study. |
| [`../CLAUDE.md`](../CLAUDE.md) | Coding conventions, architecture rules, project structure, self-review + documentation discipline. |

## How to pick this up later (onboarding)
1. **Read** [ROADMAP.md](ROADMAP.md) §1–§2 (decisions + shipped inventory) and
   [`../CLAUDE.md`](../CLAUDE.md) (how the code is organized and written).
2. **Skim** [CHANGELOG.md](CHANGELOG.md) to see what's been built and when.
3. **Open** [ui_mockups.html](ui_mockups.html) to see the target UI.
4. **Build / run** — see below.

### Prerequisites
- Rust 1.93+ (edition 2024)
- Node 20+ and npm
- Docker + Docker Compose (Postgres). `just` recommended (`brew install just`).

### Run locally
```bash
cp .env.example .env    # first time only
just setup              # sqlx-cli + npm install (first time)
just dev                # Postgres + migrate + seed + backend :3001 + frontend :3000
```
- **Site:** http://localhost:3000 · **API:** http://localhost:3001/healthz
- **Admin:** http://localhost:3000/admin/login — dev credentials `admin` / `admin`
- After directive/seed changes: `just seed-refresh`
- Quality gate: `just check` · `cd frontend && npm run lint && npm run build`

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
   (Resend/Postmark/SES) in `backend/src/infra/mailer/` for live sending.

> Publishing workflow: log into `/admin`, write/publish — the post goes live and
> confirmed subscribers are notified. (No git/markdown step; Postgres is the source of truth.)

## MVP at a glance — ✅ complete

Phases 0–2.5 and React migration M1–M7 are done. Remaining MVP gaps: real email
provider + first production deploy.

**What to build next:** [ROADMAP.md](ROADMAP.md) §8–§9 — phased over-engineering
(Phases 4–15) with ✅/⬜ status on each feature.
