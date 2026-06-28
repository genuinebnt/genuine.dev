# Migration: Leptos → React/Next.js + Rust JSON API

**Decision (ADR-013, 2026-06-28):** split into a **Rust axum JSON API** (`backend/`)
and a **React + Next.js + TypeScript** frontend (`frontend/`), JWT auth. Reason:
Leptos is pre-1.0 (breaking churn); React+TS gives stability + ecosystem (incl.
TipTap for the WYSIWYG editor) + clean front/back separation.

## What's kept vs replaced
- **Kept (reused behind the API):** `domain/`, `infra/` (repo, render = comrak+syntect,
  auth = argon2, mailer, subscribers), `config`, `error`, **migrations**, the data model.
  Markdown is still rendered to HTML **in Rust** (keeps syntect) — the frontend just
  displays `body_html`.
- **Replaced:** Leptos UI (`ui/`, server fns, SSR shell/hydration), `cargo-leptos`,
  `leptos*`/`wasm-bindgen` deps, `tower-sessions` → **JWT** (`jsonwebtoken`).

## Target repo structure
```
backend/    # Rust axum JSON API (the current crate, de-Leptos'd)
  src/ {main, config, error, domain/, infra/, api/{mod,routes,auth,posts,admin,newsletter}}
  migrations/  Cargo.toml  Dockerfile
frontend/   # Next.js (App Router) + TS
  app/ (routes)  components/  lib/api.ts  styles/ (NotiQ SCSS)  package.json  Dockerfile
Caddyfile   # serves frontend, proxies /api → backend (same origin)
docker-compose.prod.yml  # postgres + backend + frontend + caddy
```

## API (JSON, `/api`)
**Public**
- `GET /api/posts` → list (slug,title,summary,reading_min,date,tags)
- `GET /api/posts/:slug` → full (…,body_html,prev,next)
- `GET /api/projects`, `GET /api/projects/:slug`
- `GET /api/pages/:slug` (about)
- `GET /api/search?q=` · `GET /api/tags` · `GET /api/tags/:slug`
- `GET /feed.xml`, `GET /sitemap.xml` (XML, stay in Rust)

**Auth (JWT)**
- `POST /api/auth/login {username,password}` → `{token}` (HS256, short-lived)
- `GET /api/auth/me` (verify) — Bearer token

**Admin (Bearer JWT, `require_admin` middleware)**
- `GET /api/admin/docs` (incl. drafts) · `GET /api/admin/docs/:slug`
- `POST /api/admin/docs` (upsert: render markdown → save; notify subscribers on publish)
- `DELETE /api/admin/docs/:slug`

**Newsletter**
- `POST /api/newsletter/subscribe {email}` · `GET /api/newsletter/confirm/:token`
  · `GET /api/newsletter/unsubscribe/:token`

## Frontend stack
Next.js App Router · TypeScript · **TanStack Query** (data) · plain **SCSS** (port the
NotiQ tokens/theme from `style/main.scss`) · **TipTap** (editor, later) · JWT kept in
memory (+ silent refresh) — not localStorage (XSS).

## Migration phases
- **M1 — Backend → JSON API.** Restructure to `backend/`; strip Leptos; add `api/`
  axum JSON handlers reusing domain/infra; add JWT (`jsonwebtoken`) replacing sessions;
  keep migrations/seed/feed/sitemap/newsletter. Verify all endpoints via curl. Update
  ARCHITECTURE diagrams.
- **M2 — Frontend scaffold.** Next.js + TS + TanStack Query + API client + auth context
  (JWT) + port NotiQ SCSS tokens/theme.
- **M3 — Public pages (SSR).** home, blog, post, projects, project, about — SSR for SEO,
  consuming the API.
- **M4 — Theming.** 5 presets + accent picker + per-topic accents (CSS-var approach, in React).
- **M5 — Admin.** login (JWT) + dashboard + editor (markdown first, TipTap WYSIWYG later).
- **M6 — Newsletter UI + Cmd-K + the rest of `ui_mockups.html` + NotiQ project blocks.**
- **M7 — Deploy.** Caddy serves Next + proxies `/api`; update `docker-compose.prod.yml`
  (postgres + backend + frontend + caddy); CI builds both images.

## Notes
- Same-origin deploy (Caddy) means CORS is avoided in prod; in dev, Next dev server
  proxies `/api` to the Rust backend (or enable CORS for `localhost:3000↔backend`).
- The old Leptos UI code (`src/ui/`, server fns) is removed in M1; the working MVP
  logic lives on in the API.
