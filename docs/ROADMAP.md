# genuine-folio — Roadmap

A Rust full-stack portfolio + technical blog. Dark, terminal-inspired aesthetic
(ported from `docs/notiq_portfolio.html`). Built MVP-first with AI assistance,
designed to be **generic and extensible** so new features bolt on cleanly.

**Primary MVP goal:** get to a state where publishing a new blog post is just
"write a markdown file, commit, push."

---

## 1. Decisions (locked)

| Area | Decision | Why |
|---|---|---|
| Language/stack | Rust, modular monolith. **Full Leptos (SSR + hydration) on `axum`** | One cohesive Rust full-stack — frontend + backend in one language/framework. Not microservices. |
| Rendering | **Leptos** SSR + hydration; `leptos_axum`; `cargo-leptos` build; CSS variables for theming | One stack for the whole rich/interactive roadmap (theming, WYSIWYG, explorables) — no later view-system migration. ⛔ supersedes the earlier maud+HTMX decision (ADR-009). |
| Authoring | **Browser admin** (text/markdown editor) → **Postgres is the source of truth** | Author/edit/publish entirely from the web UI; no git/file step. A classic DB-backed CMS. |
| Newsletter | **In the MVP** — subscribers + email-on-publish (double opt-in) | Owner wants subscribers notified from launch; send via a transactional email provider. |
| Database | **Postgres** (via `sqlx`, compile-time checked queries) | Matches your project work; smooth path for richer relational features. |
| Hosting | **Single VPS** (Hetzner/DO) + **Caddy** (auto-HTTPS) | Full control, cheap, good infosec/ops practice. |
| Deploy | Docker Compose (app + postgres + caddy) + GitHub Actions CD | Reproducible, easy to harden. `cargo-leptos` build in CI. |

### Why full Leptos (reversing the earlier maud+HTMX call — ADR-009)
- **One cohesive Rust full-stack** — reactive frontend + backend in one language;
  `#[server]` functions bridge them. No `maud → Leptos` migration ever.
- Fits the **heavily interactive roadmap** you want (theming, WYSIWYG editor,
  explorables, digital garden) without bolting a reactive layer on later.
- **Backend learning is preserved** — Leptos runs on `axum`; `sqlx`, auth, the
  newsletter, and server functions are all real backend work.
- **Accepted costs:** steeper start (signals + SSR/hydration + `cargo-leptos`),
  smaller ecosystem, SSR+hydration heavier than a pure content site needs (SEO is
  still fine). Chosen deliberately for stack cohesion.

---

## 2. Design system & UI/UX

The NotiQ theme is the source of truth. Extract its tokens into a shared
stylesheet and build everything from them.

**Tokens to lift from NotiQ** (already defined in `:root`):
`--bg --surface --surface2 --border --text --muted --acc` (+ blue/purple/pink/
green/warn accents), `--mono` (IBM Plex Mono), `--sans` (Inter), `--radius`,
and the spacing tokens (`--gap-card`, `--pad-card`, `--lh-body`, …).

**Light/dark mode (extensibility win):**
```css
:root { /* dark — current NotiQ values */ }
[data-theme="light"] { --bg:#f7f8fa; --surface:#fff; --text:#1a1e25; ... }
```
A toggle button sets `data-theme` on `<html>` and persists to `localStorage`;
default honors `prefers-color-scheme`. Because every component uses
`var(--…)`, nothing else changes.

**Self-host fonts** (IBM Plex Mono + Inter) instead of Google Fonts —
faster + no third-party tracking (on-brand for an infosec blog).

**Reusable components** (port from NotiQ as `maud` functions):
section label, eyebrow/hero header, meta pills, cards (`svc-card`,
`concept-card`, `stack-item`), tabs, accordions (`phase`), comm tables,
the 5-color divider bar.

**Responsive & mobile-first (MVP requirement, not polish):** a blog is read on
phones — the reading experience must be excellent on small screens from launch.
Fluid layouts, comfortable line length and tap targets, the pill nav collapses
gracefully (→ menu on mobile), the post TOC moves to a collapsible/inline form,
code blocks scroll horizontally, tables scroll, images are responsive (`srcset`
later). Test at ~360px, tablet, and desktop. NotiQ already ships media queries to
build on. `<meta viewport>` + `prefers-reduced-motion` respected.

**Information architecture / pages:**
- `/` — hero (eyebrow + accent headline + lead + meta pills) → featured posts + featured projects
- `/blog` — post list, tag filter, live search (HTMX), pagination
- `/blog/:slug` — rendered post: TOC, reading time, tags, prev/next, copy-button code blocks
- `/projects` — project card grid
- `/projects/:slug` — full case-study page (NotiQ becomes the first one)
- `/about` — about page (markdown-driven)
- `/tags/:tag` — posts by tag
- `/feed.xml`, `/sitemap.xml`, `/robots.txt`, custom `404`

---

## 3. Content pipeline (browser editor → DB)

No git/file step — **Postgres is the source of truth**. You author in the browser
admin; the render pipeline runs on save:

```
Admin editor (markdown body + title/tags/status/… fields)
        │  Save / Publish
        ▼
  render service (on save)
   1. render markdown → HTML (comrak, GFM) with syntect highlighting
   2. compute reading time, ensure unique slug
        ▼
  upsert into Postgres `documents` (body_markdown + body_html)
        │
  reads ▼
  site (axum + maud)
```

- The fields that used to be frontmatter (title, summary, tags, status,
  `published_at`, cover image) are **form inputs** in the editor, stored as
  columns / `metadata`. The markdown editor only holds the body.
- Projects (`kind = "project"`) and pages (`kind = "page"`) are authored the same
  way; project extras (repo URL, live URL, tech stack) live in `metadata` JSONB.
- The render service is the `Renderer` port (Section 13) — same code path later
  feeds Mermaid/diagram/image/embed directives. Built once, reused everywhere.

> Because the DB is now the only copy of your content, **backups matter** (Phase 3
> `pg_dump` → offsite) and **revision history** (Phase 5) is what replaces git's
> version trail. An optional markdown export/import can be added later for portability.

---

## 4. Database model (Postgres)

Generic, content-centric schema — one `documents` table serves posts,
projects, and standalone pages. Extensibility comes from `kind` + `metadata`
JSONB rather than a new table per content type.

```sql
-- documents: posts, projects, pages all share this
CREATE TABLE documents (
    id            UUID PRIMARY KEY,              -- uuid v7 (time-ordered)
    slug          TEXT NOT NULL UNIQUE,
    kind          TEXT NOT NULL,                 -- 'post' | 'project' | 'page'
    title         TEXT NOT NULL,
    summary       TEXT,
    body_markdown TEXT NOT NULL,                 -- authored in the editor
    body_html     TEXT NOT NULL,                 -- pre-rendered on save
    reading_min   INT,
    status        TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
    cover_image   TEXT,
    metadata      JSONB NOT NULL DEFAULT '{}',   -- per-kind extras (repo_url, tech[], ...)
    published_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    search_tsv    TSVECTOR                        -- full-text search index
);
CREATE INDEX documents_kind_status_idx ON documents (kind, status, published_at DESC);
CREATE INDEX documents_search_idx      ON documents USING GIN (search_tsv);

CREATE TABLE tags (
    id     UUID PRIMARY KEY,
    slug   TEXT NOT NULL UNIQUE,
    name   TEXT NOT NULL,
    accent TEXT          -- per-topic accent color (hex); NULL = brand green default
);

CREATE TABLE document_tags (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    tag_id      UUID REFERENCES tags(id)      ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);
```

**Search:** Postgres full-text (`tsvector` + GIN) for the MVP — no extra infra.
Swap in Meilisearch later if needed.

**MVP tables (added in Phase 2.5 / 2.7):** `users` (single-owner admin auth),
`subscribers` (newsletter — email, status, opt-in token).

**Future tables (post-MVP):** `comments`, `reactions`,
`series`, `page_views` (analytics), `themes`
(custom/owner themes — `tokens` JSONB; see Section 11 theming system),
`media` (uploaded images/files/video — content-addressed; see Section 11 media
layer), `link_previews` (cached OG/oEmbed unfurl metadata).

---

## 5. Tech stack (crates)

> **Note (ADR-009):** stack is **full Leptos**. Mentions of `maud`/`HTMX`/`Alpine`
> elsewhere in this doc predate that decision — read them as "Leptos component /
> reactive signal / server function." Canonical stack is below.

**Core**
- `leptos` — reactive UI framework (SSR + hydration) · `leptos_axum` — axum integration
  · `leptos_router` · `leptos_meta` · **`cargo-leptos`** — build tool
- `axum` — HTTP server (under Leptos) · `tokio` — runtime
- `tower` / `tower-http` — middleware: static assets, compression, timeouts, tracing, caching
- `sqlx` (postgres, uuid, time, json, migrate) — compile-time checked queries
- `uuid` (v7) · `time` — IDs + timestamps

**Content**
- `comrak` — GFM markdown → HTML (tables, footnotes, task lists)
- `syntect` — syntax highlighting (via comrak's syntect adapter)
- `slug` — slugify titles

**Auth & email (MVP)**
- `tower-sessions` + `argon2` — admin auth (Phase 2.5)
- email provider SDK or `lettre` (SMTP) — newsletter send (Phase 2.7)

**Infra/cross-cutting**
- `tracing` + `tracing-subscriber` — structured logging
- `figment`/`config` + `dotenvy` — configuration
- `thiserror` + `anyhow` — error types
- `rss`/`atom_syndication` — feeds · Self-hosted IBM Plex Mono + Inter; CSS-variable theming

**Testing**
- `sqlx::test` + `testcontainers` (Postgres) — integration tests
- `insta` *(optional)* — snapshot rendered views

---

## 6. Repo structure

```
genuine-folio/
├── Cargo.toml            # leptos + cargo-leptos config
├── src/
│   ├── main.rs           # server entry: config, tracing, pool, leptos+axum, shutdown
│   ├── config.rs
│   ├── error.rs
│   ├── domain/           # entities, value objects (DocumentId, Slug), invariants
│   ├── app/              # use cases + port traits
│   ├── infra/            # sqlx repos, render service, auth, mailer adapters
│   └── ui/               # Leptos: app.rs, router, pages/, components/, server fns
├── migrations/           # sqlx migrations
├── style/                # css: NotiQ tokens + themes
├── public/               # static assets (fonts, favicon) served by Leptos
├── docs/
├── Dockerfile
├── docker-compose.yml
├── Caddyfile
└── .github/workflows/deploy.yml
```

> Content is DB-only (no `content/*.md`). Start as a single binary; promote the
> layers (`domain`/`app`/`infra`/`ui`) into workspace crates when boundaries
> stabilize — the graph must forbid `domain` importing `infra`.

---

## 7. Hosting & deployment (Single VPS)

```
Internet ──HTTPS──▶ Caddy (auto Let's Encrypt, security headers)
                      └─▶ axum app  :8080   ──▶ Postgres  :5432
                      (all via docker-compose on one Hetzner/DO box)
```

- **Caddy** as reverse proxy: automatic TLS, HSTS/CSP/security headers, gzip.
- **Postgres** in compose (or native) with a named volume.
- **App** runs as non-root in a multi-stage distroless image.
- **Migrations** run on deploy (`sqlx migrate run`); **content ingest** runs at startup.
- **CD:** GitHub Actions → build image → push to GHCR → SSH `docker compose pull && up -d`.
- **Backups:** nightly `pg_dump` → offsite (Backblaze B2 / Hetzner Storage Box).
- **Observability:** `tracing` → stdout → journald; add `/healthz`.

**Infosec hardening (your domain):** SSH keys only + non-standard port, UFW
firewall, `fail2ban`, unattended security upgrades, secrets via env file
(never in image), least-privilege DB user, Caddy CSP locked down, rate limiting.

---

## 8. Milestones

### Phase 0 — Foundation
Scaffold the **Leptos (SSR + hydration) app on axum** via `cargo-leptos`; tokio +
tracing + config; Postgres pool; `sqlx` migrations; local `docker-compose`
(postgres); `/healthz`. **Done when:** the app boots, hydrates, connects to DB,
serves a styled "hello".

### Phase 1 — Render pipeline + schema (MVP core)
The `Renderer` service: markdown → HTML (comrak + syntect), reading time, unique
slug; `documents`/`tags` schema. Invoked on save by the editor (Phase 2.5).
**Done when:** a seeded post renders correctly on the site, and the render service
turns markdown into highlighted HTML.

### Phase 2 — Public site (MVP)
Leptos components from the NotiQ design tokens (`style/`); home, blog index, post
detail (TOC, reading time, copy-code), projects index + detail, about; RSS +
sitemap + robots + 404; light/dark + theming; tag filter + full-text search;
**responsive, mobile-first layout** (collapsing nav, mobile reading, scrollable
code/tables). **Done when:** the site renders beautifully and reads well **on
mobile and desktop**, and is navigable.

### Phase 2.5 — Admin: auth + browser editor (MVP) ⭐
Create posts in the browser at launch (Leptos admin).
- **Single-owner auth:** `users` table (`argon2`), session login via `tower-sessions`,
  CSRF, secure cookies (HttpOnly/Secure/SameSite), login rate-limit, `/admin/*` guard.
- **Admin:** dashboard (list incl. drafts), create/edit/delete post, draft↔publish.
- **Editor = text/markdown editor + live preview** (Leptos reactive preview).
  Full WYSIWYG + media uploads + passkeys remain Phase 5.
- **On save** (`#[server]` fn): render markdown→HTML (comrak/syntect), reading time,
  upsert to `documents`. Browser admin is the only write-path — Postgres is the truth.
**Done when:** you can log in and create/edit/publish a post from the browser.
**You learn:** authn/z, sessions, password hashing, CSRF, Leptos server functions.

### Phase 2.7 — Newsletter (MVP) ⭐ *pulled forward*
Subscribers get an email when you publish.
- **Subscribe** form → `subscribers` table; **double opt-in** (confirmation email
  with a token); unsubscribe link/token.
- **On publish** → enqueue + send a "new post" email to confirmed subscribers via a
  **transactional email provider** (Resend/Postmark/SES — deliverability), off the
  publish path (don't block the request).
- `Mailer` port (one provider impl now; swappable later).
**Done when:** a visitor can subscribe (double opt-in) and receives an email when a
post is published. **You learn:** transactional email, background work, opt-in/tokens.

### Phase 3 — Deploy (MVP live) ✅ *goal reached*
`cargo-leptos` build → Dockerfile (multi-stage, non-root); compose (app + postgres +
caddy); Caddyfile with TLS + headers; VPS provisioning + hardening; GitHub Actions
CD; backups. **Done when:** publish from the browser → live, subscribers emailed.
**You can now write posts and grow an audience.**

### Phase 4+ — Post-MVP (the over-engineering plan)
The MVP ends at Phase 3 (site live, you're writing). Everything after is a
deliberately feature-rich, dependency-ordered build. **See [Section 10](#10-post-mvp-the-over-engineering-plan)
for the full phased plan (Phases 4–12).**

---

## 9. Suggested build order (first sprint)
1. Phase 0 scaffold + compose Postgres.
2. `documents`/`tags` migration + one seed post.
3. `Renderer` service (markdown → comrak/syntect → HTML, reading time, slug).
4. Public read side: layout + `theme.css` + home + blog index + post detail.
5. Admin: auth (argon2 + sessions + CSRF) + create/edit/publish editor (markdown + HTMX preview).
6. Port `notiq_portfolio.html` into a `kind="project"` case study (authored via admin).
7. Feeds/sitemap/404 + light/dark toggle.
8. Dockerize + Caddy + VPS deploy + CD + backups.

---

## 10. Post-MVP: the over-engineering plan

> **Goal:** turn the portfolio into a genuinely feature-rich, "how did one
> person build this" showcase — and **master full-stack** doing it solo.

### Tech philosophy for solo, post-MVP work
You build everything yourself, so the stack must be **frictionless + educational +
full-stack-covering**. The rules:

1. **Stay in Rust where Rust teaches you something** (backend logic, reactive
   frontend via Leptos islands, WASM). It's your portfolio's whole thesis.
2. **Use a frictionless tool where rolling your own teaches nothing** (Caddy for
   TLS, Plausible/Grafana for dashboards, giscus if you want comments *today*) —
   then optionally rebuild it later *as a learning project* once you understand why.
3. **Each phase adds one new layer of the stack** so mastery is cumulative:
   data → auth → frontend reactivity → realtime → infra → AI → polish.
4. **Build-to-learn:** every phase names a concrete feature whose purpose is to
   teach a skill, not just exist.

Phases are dependency-ordered (auth before things needing accounts, etc.) but
otherwise pick-and-choose. Difficulty: ★ easy · ★★ moderate · ★★★ deep.

---

### Phase 4 — Reading & content experience  ★
*Theme: make the blog itself world-class before adding accounts.*

- **Rich rendering:** TOC with scroll-spy, reading-progress bar, copy-code
  buttons, code line-highlighting + filename labels, callout/admonition blocks,
  footnotes, **Mermaid** diagrams, **KaTeX** math, embeds (gist/tweet/youtube).
- **Discovery:** series/multi-part posts, collections, related posts (tag
  overlap now; embeddings in Phase 10), "popular" + "latest", tag landing pages.
- **Search upgrade:** Postgres trigram/`tsvector` → **Cmd-K command palette**
  (instant search, keyboard nav) via HTMX + Alpine.
- **Feeds & sharing:** JSON Feed + Atom, per-tag feeds, **dynamic OG social
  images** (render per-post cards server-side with `resvg`/`image`).
- **Stack:** maud partials, HTMX, Alpine, comrak plugins, `resvg`.
- **You master:** advanced HTMX/Alpine patterns, server-side image generation,
  Postgres FTS, progressive enhancement.

### Phase 5 — Identity, accounts & a real admin CMS  ★★
*Theme: own your auth stack end-to-end (huge for an infosec portfolio).*

- **Auth from scratch:** sessions (`tower-sessions`) + `argon2`, CSRF, secure
  cookies, then level up to **WebAuthn / passkeys** (`webauthn-rs`) and
  **GitHub OAuth** — implementing auth yourself is the single best full-stack lesson.
- **Admin dashboard:** web-based **markdown editor with live preview** (your
  first **Leptos island**), draft → review → publish workflow, **scheduled
  publishing**, revision history, soft-delete + restore.
- **Media library:** drag-drop image upload → S3-compatible (MinIO/Backblaze),
  auto AVIF/WebP conversion, blur-up placeholders.
- **Upgrades the hybrid model:** edit in-browser *or* in markdown; both sync to DB.
- **Stack:** `tower-sessions`, `argon2`, `webauthn-rs`, Leptos (island), `aws-sdk-s3`.
- **You master:** authn/authz, session security, file uploads, your first reactive Rust UI.

### Phase 6 — Engagement & community  ★★
*Theme: make it two-way.*

- **Comments:** start with **giscus** (frictionless, ship today) → later rebuild
  a self-hosted threaded comment system (moderation queue, spam filter) as a learning project.
- **Reactions:** claps/emoji reactions with optimistic UI (HTMX OOB swaps).
- **Newsletter:** subscribe + **double opt-in**, campaign composer, send via
  **SES/Postmark**, open/click tracking, unsubscribe tokens.
- **Guestbook + webmentions** (IndieWeb): receive mentions, display them under posts.
- **Stack:** Postgres (`comments`, `reactions`, `subscribers`), SES, webmention receiver.
- **You master:** moderation/anti-abuse, transactional email, IndieWeb standards.

### Phase 7 — Observability, analytics & infra-as-code  ★★★
*Theme: your infosec/ops playground — instrument and harden everything.*

- **Privacy-first analytics:** self-host **Plausible** *or* build your own
  `page_views` + aggregation with a live dashboard (no cookies, GDPR-clean).
- **Full observability:** **OpenTelemetry** tracing, **Prometheus + Grafana**
  dashboards, structured logs → Loki, **public status page** + uptime monitoring,
  alerting.
- **Security hardening:** strict **CSP** + CSP-report endpoint, rate limiting
  (`tower` middleware), `security.txt`, secrets rotation, dependency scanning
  (`cargo audit`) in CI, signed releases.
- **Infra-as-code:** move the VPS to **Terraform + Ansible** (reproducible box),
  **feature flags**, blue/green or canary deploys, automated backup *restore drills*.
- **Stack:** `tracing-opentelemetry`, Prometheus, Grafana, Terraform, Ansible.
- **You master:** the entire ops/SRE/security half of full-stack — the rarest skill set.

### Phase 8 — Interactive showcases (the "wow" features)  ★★★
*Theme: a portfolio that demonstrates skill, not just describes it.*

- **Live Rust playground:** compile + run Rust **in the browser via WASM** —
  embed runnable snippets inside blog posts.
- **Interactive project demos:** embed live, playable demos in NotiQ-style case
  studies (architecture diagrams that animate, metrics that load live).
- **Dev-life integrations:** GitHub contributions + pinned repos (GitHub API),
  WakaTime coding stats, "now playing" (Spotify), latest commit / build badges.
- **Generative pages:** `/uses`, `/now`, an animated timeline/changelog, a
  **resume/CV generator** that exports PDF from your DB.
- **Stack:** `wasm-bindgen`/Leptos islands, external APIs, `printpdf`/typst for CV.
- **You master:** WASM, third-party API integration, data-driven UI, client/server split.

### Phase 9 — Real-time & the social web  ★★★
*Theme: live, connected, syndicated.*

- **WebSockets/SSE:** live visitor count, "N people reading this," live reaction
  stream, real-time comment updates (`axum` WS + HTMX SSE extension).
- **Fediverse / IndieWeb:** **POSSE** (auto-syndicate new posts to Mastodon /
  dev.to / Bluesky), and optionally **ActivityPub** so people can *follow your
  blog from Mastodon* — a serious flex.
- **Stack:** `axum` WebSockets, `tokio` broadcast channels, ActivityPub.
- **You master:** real-time architecture, pub/sub, federated protocols.

### Phase 10 — Intelligence layer (AI, on your terms)  ★★★
*Theme: you build with AI — make the site smart too.*

- **Semantic search & "ask my blog":** embed posts into **pgvector**, build a
  **RAG chatbot** that answers questions over your writing (Claude API).
- **Smart content:** AI TL;DR summaries, auto-tagging, embedding-based related
  posts, auto-generated OG image art, optional i18n/translation.
- **Stack:** `pgvector`, Claude API (`claude-opus-4-8` / latest), `tokio` streams.
- **You master:** vector DBs, RAG, streaming LLM responses, prompt/eval design.

### Phase 11 — Infosec specialization (your niche)  ★★
*Theme: lean into what makes your portfolio *yours*.*

- **CTF writeup system:** spoiler/blur reveals, challenge metadata (category,
  points, difficulty), flag-format hints, per-writeup tooling.
- **Embedded mini-challenges:** small, sandboxed security puzzles hosted on the
  site (safe-by-design — great content + a security-engineering exercise).
- **Trust signals:** `/security` page, PGP key, signed posts/commits, a
  "how this site is secured" meta writeup (turn Phase 7 into content).
- **You master:** secure sandboxing, content security, security UX.

### Phase 12 — Performance, PWA & architectural maturity  ★★
*Theme: make it fast, installable, and cleanly extensible.*

- **Performance:** edge/HTTP caching + ETags, Brotli, responsive `srcset`,
  **View Transitions API**, scroll-driven animations, Lighthouse 100s.
- **PWA:** offline reading, installable, service worker, background sync.
- **A11y & i18n:** WCAG audit, full keyboard nav, reduced-motion, localization.
- **Architecture maturation:** split into a **Cargo workspace** (content / web /
  domain crates), a **content-type registry + plugin hooks** so new content
  kinds and features drop in without touching core, optional headless **API**
  (REST/GraphQL) for future clients.
- **You master:** performance engineering, PWA, accessibility, and designing for
  extensibility — closing the loop on full-stack mastery.

### Phase 13 — Digital garden & knowledge graph  ★★
*Theme: connected knowledge, not just a reverse-chron list (Maggie Appleton ·
Andy Matuschak · Obsidian).*
- **Bidirectional links:** wiki-style `[[links]]` between posts; every page shows
  **backlinks** ("posts that link here").
- **Internal link hover previews:** hover an internal link → popover card with the
  target's title/summary (Wikipedia/Obsidian style).
- **Content growth stages:** mark notes 🌱 seedling → 🌿 budding → 🌳 evergreen;
  show "last tended" + a freshness/stale indicator.
- **Short-form `note` / TIL kind:** quick notes alongside long posts — new `kind`,
  zero schema change.
- **Graph view:** interactive force-directed graph of posts/notes/tags; **topic
  maps (MOCs)** as curated index pages.
- **Stack:** links resolved in the `Renderer`; backlink index maintained via the
  `EventBus` on publish; graph as a small client viz. **You master:** graph data
  modeling, link resolution, incremental index maintenance.

### Phase 14 — Reader experience & delight  ★★
*Theme: a joy to read (Josh Comeau · Bartosz Ciechanowski) with your terminal
personality.*
- **Reader preferences:** font size, family (sans / serif / dyslexia-friendly),
  line width — persisted; a reading-settings menu. **Focus / distraction-free mode**,
  optional **reading ruler**, scroll-position restore.
- **Listen to article:** text-to-speech / generated audio version.
- **Highlight-to-share:** select text → share a quote (deep link to the highlight,
  copy, post to socials) — Medium-style.
- **Footnotes / sidenotes as hover popovers**; **copy-link anchors** on headings.
- **Keyboard navigation:** `j/k` between posts, `/` search, `g h` home — vim-style,
  with a `?` shortcuts overlay.
- **Interactive explorables:** a pattern for embedding live visualizations in posts
  (canvas/WASM widgets, animated step-throughs) — Ciechanowski-style learning content.
- **Tasteful whimsy:** subtle micro-interactions, a delightful like button, an
  optional sound/"boop" toggle, easter eggs (Konami code).
- **On-brand over-engineering:** an **in-browser terminal** to navigate the site
  (`ls posts`, `cat about` — fits the NotiQ terminal aesthetic), and **curl/CLI
  access** via HTTP content negotiation (`curl genuine.dev` → clean ASCII/plaintext;
  browsers get HTML). **You master:** progressive enhancement, reader/a11y UX, HTTP
  content negotiation.

### Phase 15 — Personal data pages & "the colophon"  ★
*Theme: the small touches that make a site feel hand-built.*
- `/colophon` (how this site is built), `/uses`, `/now`, `/credits`.
- `/bookshelf` (currently reading / read), `/changelog` (what's new on the site).
- Public **writing-stats dashboard** — streak, words written, posts over time.
- **Image power-blocks:** before/after comparison slider, gallery/lightbox, blurhash
  placeholders, captions. **You master:** small data-driven pages, image UX.

---

### Full-stack mastery map (what the phases cover, end to end)
| Layer | Phases | You'll have built yourself |
|---|---|---|
| Data / persistence | 0–1, 10 | Postgres schema design, migrations, FTS, pgvector |
| Backend / domain | 0–6 | axum, ingest pipeline, auth, email, business logic |
| Frontend (SSR) | 2, 4 | maud, HTMX, Alpine, CSS systems, theming |
| Frontend (reactive) | 5, 8 | Leptos islands, WASM, live preview editor |
| Real-time | 9 | WebSockets/SSE, pub/sub, federation |
| AI | 10 | embeddings, RAG, streaming LLMs |
| DevOps / SRE | 3, 7 | Docker, Caddy, Terraform, Ansible, CI/CD, canary |
| Observability | 7 | OTel, Prometheus, Grafana, status page |
| Security | 5, 7, 11 | authn/z, passkeys, CSP, hardening, sandboxing |
| Performance / UX | 4, 12 | caching, PWA, a11y, View Transitions |
| Knowledge graph | 13 | bidirectional links, backlinks, graph viz, incremental indexes |
| Reader UX / delight | 14–15 | content negotiation, reader prefs, explorables, image UX |

---

## 11. Rich content & authoring — capability matrix

Explicit feature requests mapped to phase, approach, and tech. **Markdown stays
the canonical source of truth** (git + DB, per the hybrid model); every richer
feature is either a markdown extension, an embed, or an editor that *serializes
back to markdown* — so nothing breaks version control.

| Capability | Phase | Approach / tech |
|---|---|---|
| **Markdown (GFM)** | 1 | `comrak` (tables, footnotes, task lists, autolinks). Body authored in the editor; rendered on save. Canonical format. |
| **Code snippets** | 1–2 | `syntect` highlighting, copy button, filename label, line highlighting, diff blocks. |
| **Code embeds** | 4 | External gists/CodePen via oembed; **runnable Rust** snippets via WASM playground (Phase 8). |
| **Diagrams** | 4 | **Mermaid** (flow/sequence/ER) rendered client-side; **KaTeX** for math; optional D2/Graphviz server pre-render → SVG. |
| **Images** | 4–5 | Upload → object storage; auto **AVIF/WebP**, responsive `srcset`, blur-up placeholder, lightbox, captions. |
| **Video** | 4–5 | Embeds (YouTube/Vimeo via oembed) now; **self-hosted video** (`<video>`, poster, optional HLS transcode) later. |
| **File uploads / media library** | 5 | Drag-drop → **S3-compatible** (MinIO/Backblaze), signed URLs, dedupe by hash, alt-text, reusable picker in the editor. |
| **WYSIWYG editor** | 5 | **Markdown-WYSIWYG** (see decision below) with live preview, slash commands, drag-drop media, draft/publish. |
| **Fast search** | 4 → 10 | Postgres **`tsvector` + trigram** + **Cmd-K palette** (instant, keyboard nav); **pgvector semantic search** in Phase 10; Meilisearch only if needed. |
| **Tags** | 1–2 | `tags` + `document_tags`, tag pages, multi-tag filter, tag-scoped feeds, tag cloud. |
| **Comments** | 6 | **giscus** to ship fast → self-hosted threaded comments + moderation + spam filter as a learning rebuild. |
| **Reactions** | 6 | Claps/emoji with optimistic HTMX out-of-band swaps. |
| **Theming system** | 2 → 5 | CSS custom properties + `[data-theme]`; light/dark in Phase 2, then a full **custom + saved themes** system (see below). |
| **Responsive / mobile reading** | 2 | Mobile-first fluid layout, collapsing nav, mobile TOC, scrollable code/tables, responsive images, reduced-motion. A blog must read well on phones from launch. |
| **+ more** | 4–6 | Series/collections, related posts, RSS/Atom/JSON feeds, dynamic OG images, newsletter, callouts/admonitions. |

### Theming system (custom + saved themes)
Because every component renders from CSS custom properties, a **theme is just
data** — a named map of token values. That makes a full theming system cheap and
very extensible.

**What it does**
- **Preset themes** beyond light/dark: e.g. *midnight* (indigo), *sepia* (warm),
  *matrix* (green-on-black), *high-contrast* (a11y). A visitor picker switches instantly.
- **Customize colors:** an accent-color picker (and optionally full token editing)
  so a visitor — or you, the owner — can tweak the palette live.
- **Save themes:** persist the selection/custom theme. Anonymous visitors →
  `localStorage`; logged-in users (Phase 5) → DB-backed user preference. Owner-authored
  themes → stored in a `themes` table and served site-wide.
- **No flash of wrong theme:** the chosen theme is applied before first paint
  (inline boot script reads the stored value, like the toggle in `ui_mockups.html`).

**How it's built (architecture)**
- A `Theme` = `{ slug, name, tokens: map<var,value>, base: light|dark }`. Built-in
  presets ship in code; custom/owner themes live in a **`themes` table** (`tokens`
  JSONB). A `ThemeProvider` port (Section 13) resolves the active theme.
- **Apply** by injecting a small `:root`/`[data-theme="slug"]` variable block (or a
  cached per-theme CSS file). Switching = swap the `data-theme` attribute — zero
  component changes, ever.
- **Admin theme editor (Phase 5):** a live-preview builder — adjust tokens, see the
  whole site re-theme, save as a named theme. (Your first non-trivial Leptos-island
  use beyond the editor.)

**Default theme:** the **NotiQ green** (`--acc:#00d4a4`) is the brand/default
accent — dark by default, with an accessible green light mode (`#008f6f`). Green
doubles as the *infosec* topic color (see below).

**Per-topic accents (contextual theming).** Beyond a global theme, each **topic/
section gets its own accent** so a page's color signals what it's about — green
for infosec, orange for rust/coding, blue for distributed, red for CTF/offensive,
etc. Because a topic just re-points `--acc`, the whole page (nav, links, TOC,
code highlight, chips) re-tints with one attribute.

- **Mechanism:** the page root carries `data-topic="rust"`; CSS `[data-topic]`
  rules override `--acc`/`--acc-bg`/`--acc-border`. No per-page CSS, no JS.
- **Source of colors (saved):** each tag/topic stores its accent in the DB
  (`tags.accent` or a `topics` table). A document may override with its own
  `metadata.accent`. Defaults fall back to brand green.
- **Layering / precedence** (lowest → highest): base theme (light/dark + surfaces)
  → topic accent (page identity) → per-document override → optional visitor custom
  accent. Recommended default: topic colors are *brand identity* and apply on topic
  pages; a visitor's manual accent is an opt-in "use my color everywhere."
- **Suggested topic palette:** infosec `#00c896` (green/brand) · rust/coding
  `#f0703c` · distributed `#4a90e8` · performance `#d957d4` · ctf/offensive
  `#ef5350` · systems `#9270e0`. (Live in `docs/ui_mockups.html` — the Post screen
  is a rust page tinted orange; Design-system screen lists all topics.)

**Phasing:** Phase 2 = light/dark + green default + 2–3 presets + per-topic accents
(static map, `localStorage`). Phase 4–5 = topic colors editable & DB-saved, accent
picker, per-user themes, owner theme editor. Later = shareable theme links /
import-export, per-post accent override.

### Decision needed: WYSIWYG editor flavor
A *pure* rich-text editor that stores HTML would break the markdown-in-git
model. The three viable flavors (all keep markdown as the stored format):

1. **Markdown + live preview (split pane)** — CodeMirror 6 editor on the left,
   rendered preview on the right. Simplest, most predictable, you still see raw
   markdown. *(EasyMDE / CodeMirror)*
2. **Markdown-WYSIWYG (recommended)** — you type and it *looks* rendered inline
   (bold renders bold), slash commands, drag-drop images — but it serializes to
   clean markdown under the hood. Frictionless like Notion, git stays clean.
   *(Milkdown or TipTap/ProseMirror with a markdown serializer)*
3. **Dual-mode** — toggle between WYSIWYG and raw markdown on the same document.
   Most work; best UX. Build it last.

**Decision (locked):** **MVP = markdown authoring only** (write `.md`, commit,
push — no in-browser editor). The **WYSIWYG editor is deferred to Phase 5**:
ship flavor **#1** first (markdown + live preview), then upgrade to **#2**
(markdown-WYSIWYG) as a deliberate learning project. Both integrate an existing
JS editor lib (frictionless) and mount as a **Leptos island** in the admin —
your first reactive Rust UI wraps a battle-tested editor rather than reinventing
one. (Final #1-vs-#2 sequencing can be reconfirmed when you reach Phase 5.)

### End-goal: rich content as a block/directive registry
The north star is a production-grade CMS authoring experience — paste a link and
it unfurls into a rich card, drop an image/file/video, write fenced code with real
highlighting, render Mermaid/diagrams/math — all from the editor. The way to reach
that *without it becoming a swamp* is **one architectural backbone**: the
`Renderer` (Section 13) is a **registry of content blocks/directives**. Each rich
type is a small, independently-registered handler — build the mechanism once, then
every new embed is additive, never a rewrite.

Three supporting subsystems:
- **Block/directive registry** (the `Renderer`): markdown stays canonical; rich
  blocks are directives (`:::mermaid`, `:::video{…}`, fenced code, `![](…)`,
  link-card syntax). The WYSIWYG editor's slash-commands / drag-drop serialize
  *to these directives* — so what you author maps 1:1 to what renders.
- **Media layer** (`StorageBackend` port): image/file/video uploads → object
  storage (S3-compatible / MinIO), content-addressed, `media` table + media
  library, responsive image derivations. Backs images, files, and video.
- **Link-preview (unfurl) service:** fetch a URL's OpenGraph/oEmbed metadata,
  sanitize, cache (`link_previews` table), render as a rich card. ⚠ **SSRF-sensitive** —
  server-side fetching of user-supplied URLs needs egress allowlists, timeouts,
  redirect limits, and private-IP blocking (your bug-bounty domain — build it *as*
  a security feature).

How each content type is built, and when:

| Rich content | Mechanism | Phase |
|---|---|---|
| paragraphs · headings · lists · quotes | comrak GFM (built-in) | 1 |
| code snippets + syntax coloring | syntect: lang detect, line highlight, copy, filename | 1 |
| markdown text (canonical) | comrak; everything else is a directive on top | 1 |
| images | media upload → AVIF/WebP, `srcset`, blur-up, lightbox, caption | 4–5 |
| files | file-embed block (icon · name · size · download) over media layer | 5 |
| video | oEmbed (YouTube/Vimeo) + self-hosted `<video>` block | 4–5 |
| diagrams · Mermaid · math | Mermaid + KaTeX directives (client render or server pre-render to SVG) | 4 |
| **link unfurls** ("hyperlinks that show the content") | OG/oEmbed fetch + cache + rich card | 6 |
| embeds (tweets · gists · CodePen) | oEmbed providers | 4–6 |
| callouts · asides · spoilers | registered directives | 4 (spoilers → 11) |

**The MVP already lays this foundation**, so nothing here is blocked later: the
`Renderer` port + comrak/syntect (Phase 1), the `documents.body_markdown/_html`
columns, and the `StorageBackend`/media seam (Section 13) are all in from day one.
Rich blocks then arrive as registered handlers + an editor that emits their
directives — purely additive.

### Project case-study system (NotiQ component library)
`docs/notiq_portfolio.html` is rich and bespoke — architecture SVG, color-coded
service cards, a comm matrix, build-narrative accordions, engineering-depth tabs,
an ER diagram, tech-stack grid, design-decision lists. **Goal: every new project
page can use all of these**, composed from a **reusable block library** — never
hand-coded HTML per project.

Each NotiQ element becomes a registered block/directive (the `Renderer`, Section 13)
plus an editor insert affordance. A project (`kind="project"`) is then *composed*
from blocks: structured data (cards, matrix rows, tech list) lives in the block /
`metadata`; bespoke visuals (architecture/ER diagrams) are embedded as Mermaid or
uploaded SVG.

| NotiQ element | Block / mechanism | Phase |
|---|---|---|
| project hero (eyebrow · accent title · lead · meta pills · divider) | structured header block | 2 (basic) |
| tech-stack grid · links (repo/live) | chips + links from `metadata` | 2 |
| section labels · markdown body · tables | maud + comrak (tables work in MVP) | 2 |
| service / bounded-context cards (color-coded grid) | `:::cards` directive (data-driven) | 4 |
| communication matrix | markdown table or `:::matrix` block | 4 |
| build-narrative accordions (phases + decisions) | `:::accordion` directive (HTMX/Alpine) | 4 |
| engineering-depth tabs (concept cards by domain) | `:::tabs` directive | 4 |
| infra / coverage grid | `:::grid` card block | 4 |
| architecture diagram · ER diagram | Mermaid / uploaded SVG embed | 4 |
| design-decision signal list · tradeoffs | `:::signals` / card-grid blocks | 4 |

**MVP** ships basic project pages (hero + tech chips + links + markdown/tables) so
projects are live and listable. The **full NotiQ block library** lands with the
rich-content directives in **Phase 4**; live/animated demos in **Phase 8**. These
are the *same* registered directives used everywhere — building them for projects
also enriches posts.

> The components already exist visually in `notiq_portfolio.html` / `ui_mockups.html`;
> the work is turning that CSS into reusable `maud` components + directives, not
> redesigning. No project page is ever bespoke HTML again.

---

## 12. DevOps & CI/CD

Treated as a first-class, learnable layer (not an afterthought). Built in two
tiers: a **frictionless MVP pipeline (Tier 1, ships in Phase 3)** and a
**production-grade pipeline (Tier 2, matures in Phase 7)**. Single source of
truth, everything in the repo, nothing clicked by hand.

```
 commit ─▶ CI (PR gate) ─▶ merge to main ─▶ CD ─▶ VPS ─▶ health check ─▶ ✅
            fmt·clippy·test·audit          build img·push·migrate·deploy   └─fail─▶ rollback
```

### Local dev (frictionless inner loop)
- `docker-compose.yml` for **Postgres** (+ MinIO later) — one `docker compose up`.
- **`bacon`** or `cargo watch` for hot recompile/reload.
- **`sqlx` offline mode** (`cargo sqlx prepare`) so the build/CI don't need a live
  DB and schema drift is caught at compile time.
- **`just`** (justfile) for task shortcuts: `just dev`, `just test`, `just migrate`, `just deploy`.
- **pre-commit hooks**: `cargo fmt` + `clippy` before every commit (fast feedback).
- `.env` via `dotenvy`; secrets never committed (`.env` git-ignored, `.env.example` tracked).

### Tier 1 — MVP pipeline (Phase 3)
**CI — runs on every PR/push (the merge gate):**
1. `cargo fmt --check` — formatting.
2. `cargo clippy -- -D warnings` — lint, warnings fail the build.
3. `cargo test` — unit + integration tests against a **Postgres service container**, migrations applied first.
4. `cargo sqlx prepare --check` — query/schema drift detection.
5. `cargo audit` (or `cargo-deny`) — known-vuln dependency scan.
6. Rust build cache via `Swatinem/rust-cache` to keep CI fast.

**CD — runs on merge to `main`:**
1. Build a **multi-stage Docker image** (build stage + minimal non-root runtime, e.g. distroless).
2. Push to **GHCR** (GitHub Container Registry), tagged with git SHA + `latest`.
3. **Deploy to VPS**: SSH in → `docker compose pull && docker compose up -d`
   (or a pull agent). A dedicated, least-privilege deploy key — not your personal SSH key.
4. **Run migrations** as a release step (`sqlx migrate run`) before traffic shifts.
5. **Health check** `/healthz` after deploy; **auto-rollback** to previous image tag on failure.
6. Caddy handles TLS + zero-downtime reload; container swap is graceful (drain in-flight requests).

### Tier 2 — production-grade (Phase 7)
- **Infra-as-code**: **Terraform** provisions the VPS/DNS/firewall; **Ansible**
  configures the box (users, Docker, Caddy, hardening) — reproducible from zero.
- **Environments**: `local` → `staging` (optional, on a subdomain) → `production`,
  promote the *same image* between them (build once, deploy many).
- **Secrets management**: GitHub **OIDC** instead of long-lived keys where possible;
  on-server secrets via env file / SOPS / Vault — never baked into images.
- **Zero-downtime**: **blue/green** or canary deploy; automated rollback on metric/health regression.
- **Supply-chain security** *(your infosec angle)*: `cargo-deny` license+advisory
  gate, **Trivy** container image scan, **SBOM** generation, **Dependabot/Renovate**
  for dep updates, optional image signing (cosign).
- **Observability hooks** (ties to Phase 7): deploy emits a marker to tracing;
  CI publishes test/coverage reports; status page reflects deploy events.
- **Backups as code**: scheduled `pg_dump` → offsite, plus **periodic restore drills**
  verified in CI (a backup you've never restored isn't a backup).

### Files this adds to the repo
```
.github/workflows/ci.yml        # fmt, clippy, test, audit, sqlx check
.github/workflows/deploy.yml     # build → GHCR → SSH deploy → migrate → health
Dockerfile                       # multi-stage, non-root runtime
docker-compose.yml               # prod: app + postgres + caddy
docker-compose.dev.yml           # local: postgres (+ minio later)
Caddyfile                        # TLS + security headers + reverse proxy
justfile                         # dev/test/migrate/deploy shortcuts
.sqlx/                           # offline query metadata (committed)
terraform/  ansible/             # Tier 2 (Phase 7)
```

**You master:** containerization, CI gating, registry-based deploys, migration
safety, zero-downtime strategy, IaC, supply-chain security, and backup/restore
discipline — the full DevOps/SRE half of "full-stack."

---

## 13. Architecture & extensibility — patterns & principles

The whole point of the generic `documents` model and the modular monolith is
that **Phases 4–12 plug in without rewrites**. This section codifies the Rust
and architectural patterns that make that true.

> **Guiding principle — abstract at the seams you *know* will change, stay
> concrete everywhere else.** Define a trait/port where a second implementation
> is genuinely coming (storage, search, email, auth, rendering, events). Don't
> abstract a thing with one implementation and no roadmap reason — that's
> over-engineering, not extensibility. Rule of three for everything else.

### Architectural pattern: hexagonal / ports-and-adapters
Domain logic at the center, knows nothing about axum, sqlx, or S3. Everything
external is an adapter behind a **port (trait)**. Dependencies point *inward*.

```
            ┌──────────────── web (Leptos SSR + server fns) ── adapter (inbound)
            │
  inbound ──▶  application  ──▶  domain (pure logic, entities, invariants)
            │  (use cases /         ▲
            │   services)           │  ports (traits)
            └──────────────── infrastructure ── adapters (outbound)
                              sqlx · storage · email · search · LLM
```

- **domain** — entities (`Document`, `Tag`, `Series`), value objects, invariants.
  No I/O, no framework types. Pure, trivially unit-testable.
- **application** — use cases (`PublishPost`, `RenderDocument`, `SearchDocuments`)
  orchestrating domain + ports. This is where features compose.
- **infrastructure** — concrete adapters implementing the ports (Postgres repo,
  render service, mailer, storage).
- **web** — Leptos components + `#[server]` functions; thin, maps HTTP ↔ application.

### Workspace = compile-time-enforced boundaries
Start as one binary, promote to a Cargo **workspace** (Phase 12, or earlier) so
the layering is enforced by the compiler, not discipline:
```
crates/
  folio-domain/    # zero deps on web/db/infra — the core
  folio-app/       # use cases; depends on domain + port traits
  folio-infra/     # sqlx, S3, email, search adapters (impl the ports)
  folio-web/       # axum + maud (inbound adapter)
  folio-bin/       # wires it together (main, config, DI)
```
`folio-domain` literally *cannot* import sqlx — the dependency graph forbids it.

### The extensibility seams (define these ports early)
Each is a trait with one impl now and a known second impl later:

| Port (trait) | MVP impl | Future impls (phase) |
|---|---|---|
| `ContentRepository` | Postgres (sqlx) | read-replica / cache |
| `StorageBackend` | local FS | S3 / MinIO / B2 (5) |
| `SearchBackend` | Postgres FTS | Meilisearch, pgvector (4, 10) |
| `Renderer` (md pipeline) | comrak+syntect | + Mermaid/KaTeX/callouts (4) |
| `AuthProvider` | — | session, passkey, OAuth (5) |
| `Mailer` | — | SES / Postmark / Resend (6) |
| `EventBus` subscribers | — | analytics, search-index, webmention, POSSE (6–9) |
| `ContentKind` registry | post/project/page | new kinds, no schema change |
| `ThemeProvider` | built-in light/dark presets | DB-saved custom/owner themes, per-user prefs (2 → 5) |

### Event-driven seam (decoupling for later features)
Emit **domain events** (`DocumentPublished`, `CommentPosted`) to an internal
bus; features subscribe without the core knowing they exist. Start simple
(`tokio::sync::broadcast` in-process), grow to an **outbox table + worker** when
durability matters. This is how analytics, search indexing, webmentions, and
POSSE attach in later phases with zero changes to publish logic.

### Best Rust patterns to apply
- **Newtype IDs & value objects** — `DocumentId(Uuid)`, `Slug(String)` (validated
  on construction). No bare `Uuid`/`String` leaking domain meaning; invariants
  enforced by the type system ("parse, don't validate").
- **Typestate where it buys safety** — e.g. `Document<Draft>` vs `Document<Published>`
  so you can't, say, generate a feed entry from an unpublished doc at compile time.
- **Error strategy** — `thiserror` typed enums per layer; `?` + `From` to bubble;
  map to HTTP only at the web boundary via `IntoResponse`. `anyhow` only in `main`/bin.
- **DI via traits + `AppState`** — shared deps as `Arc<dyn Port>` in axum state;
  constructors take ports, so tests inject fakes. No globals/singletons.
- **Layer-to-layer conversions** — `From`/`TryFrom` between db row → domain →
  view model. DB types never reach views; domain types never carry sqlx derives.
- **Generics vs `dyn`** — `dyn` behind `Arc` for runtime-swappable ports
  (registry, config-selected backends); generics/monomorphization on hot paths.
- **`tower` for cross-cutting concerns** — tracing, auth, rate-limit, timeout,
  compression as composable middleware layers (the NotiQ circuit-breaker pattern).
- **Layered config** — `figment`: defaults → file → env; a `Config` struct built
  once, no scattered `env::var`.
- **Async hygiene** — structured concurrency, `tokio::select!`, `CancellationToken`
  for graceful shutdown (drain in-flight on SIGTERM).
- **Testing** — trait fakes for fast unit tests; `testcontainers` (Postgres) for
  integration; `insta` snapshots for rendered maud views.
- **Module hygiene** — `pub(crate)` by default, a small `prelude`, feature flags
  (`cfg(feature)`) to gate optional capabilities and keep MVP builds lean.

### Anti-patterns to avoid (over-engineering guardrails)
- No trait/abstraction for something with one impl and no roadmap reason.
- No premature workspace split — modules first, crates when boundaries stabilize.
- No microservices (Section 1). No generic "framework within the framework."
- No leaking infrastructure types (`PgRow`, `aws_sdk_*`) past the adapter layer.

**You master:** clean/hexagonal architecture, trait-based design, type-driven
domain modeling, and the judgment of *where* to abstract — the difference
between extensible and over-engineered.

---

## 14. Inspiration — fasterthanlime-grade over-engineering

Amos Wenger's [fasterthanli.me](https://fasterthanli.me) is the reference for a
lovingly over-engineered Rust blog. Notably, his approach **validates our stack**:
custom Rust engine, server-side rendering, minimal/no JS framework, progressive
enhancement, markdown source, content as a git repo, and self-hosted/owned infra.
The signature *ideas* worth borrowing (adapt, don't copy), mapped to phases:

| Idea (inspired by his approach) | What to build | Phase |
|---|---|---|
| **Character asides** ("Cool Bear's Hot Tip" — a mascot interjects in dialog) | A custom markdown directive that renders a styled conversational aside with *your own* character/persona. Personality + a reusable directive. | 4 |
| **Rich custom markdown directives** | Shortcodes beyond GFM: asides/callouts, sidenotes (margin notes), multi-file code tabs, collapsible details, "spoiler" reveals. All via the `Renderer` port. | 4 (CTF spoilers → 11) |
| **Server-side syntax highlighting with annotations** | `syntect` highlighting plus inline diff highlighting, line callouts, and "this line changed" annotations baked at render time (no client JS). | 1 → 4 |
| **Content-addressed asset pipeline** | Hash every asset; derive responsive image sets (AVIF/WebP, multiple widths) + blur placeholders at ingest; cache-bust by content hash. Fast + immutable. | 5, 12 |
| **Tiered / gated content** (patron-only, drafts behind auth) | A `visibility` tier on documents (public / members / draft); gate render + feeds by viewer. Pairs with auth. | 5 |
| **Strong series navigation** | First-class `series` with prev/next, progress, and a series index — his long multi-part deep-dives are a model. | 4 |
| **Live-reload authoring** | WebSocket-driven hot reload of the rendered page while you write locally (and later in the editor). | dev loop → 9 |
| **Streaming / progressive HTML** | axum streaming responses so long pages start painting immediately. | 12 |
| **Deep observability as content** | Heavy OTel instrumentation — then write about it. Turn your infra into blog material. | 7 |
| **Home-cooked, fully-owned infra** | Self-host everything you reasonably can; own the whole stack end-to-end (matches your VPS direction). | 3, 7 |

### The highest-leverage borrow
The **character aside** + **custom directive system** is the single best idea to
take: it gives the blog *personality* (your own "hot tip" persona) and forces a
clean, extensible `Renderer` with a directive registry — so every future custom
block (callouts, spoilers, interactive widgets, CTF reveals) is just another
registered directive. Build the directive mechanism once in Phase 4; everything
content-rich plugs into it forever.

> Reminder (Section 13 principle): borrow the *ideas*, but only build each when
> it earns its place. Over-engineered-with-taste = lots of features, each with a
> reason — not abstraction for its own sake.

### More inspiration (feature-rich blogs)
Sources behind Phases 13–15 (adapt, don't copy):
- **[joshwcomeau.com](https://www.joshwcomeau.com)** — whimsical micro-interactions,
  delightful like button, custom interactive components → Phase 14.
- **[ciechanow.ski](https://ciechanow.ski)** — best-in-class interactive explorables
  embedded in articles → Phase 14 explorables.
- **[maggieappleton.com](https://maggieappleton.com)** & **[Andy Matuschak's notes](https://notes.andymatuschak.org)**
  — digital gardens: bidirectional links, backlinks, growth stages → Phase 13.
- **[antfu.me](https://antfu.me)**, **[brianlovin.com](https://brianlovin.com)**,
  **[leerob.com](https://leerob.com)** — `/uses`, dashboards, life-stat integrations
  → Phases 8 + 15.
- **Tufte CSS / Obsidian / IndieWeb / Wikipedia** — sidenotes, hover link previews,
  webmentions, microformats → Phases 4, 6, 13.

> Web-research note (2026-06-27): live web search was rate-limited this session, so
> the above are drawn from these well-known sites directly. Worth a fresh sweep later
> for new ideas (e.g. search "digital garden features", "MDX interactive blog").
