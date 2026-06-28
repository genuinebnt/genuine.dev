# genuine.dev — Roadmap

A Rust + React full-stack **portfolio + technical blog**, built as a **DB-backed CMS**.
Dark, terminal-inspired aesthetic (NotiQ design system). MVP-first, deliberately
extensible — the post-MVP plan is where the fun over-engineering lives.

**Primary goal:** publish from the browser admin; Postgres is the single source of
truth. No git/file ingest step.

**Last updated:** 2026-06-28 · **Stack:** ADR-013 — Rust axum JSON API (`backend/`) +
Next.js 16 + React 19 + TypeScript (`frontend/`). ⛔ Supersedes the Leptos/maud MVP
(ADR-009); see [REACT-MIGRATION.md](REACT-MIGRATION.md).

---

## 1. Decisions (locked)

| Area | Decision | Why |
|---|---|---|
| Backend | Rust modular monolith on **axum** — hexagonal (domain / app / infra / api) | One language for render pipeline, auth, email, search; not microservices. |
| Frontend | **Next.js App Router** + React 19 + TypeScript + SCSS (NotiQ tokens) | Stable ecosystem; TipTap WYSIWYG; SSR for SEO; clean API boundary. |
| Rendering | **Rust** — comrak GFM + syntect on save; frontend displays `body_html` | Keeps syntax highlighting server-side; one render path for feeds + site. |
| Authoring | **Browser admin only** → Postgres | Classic CMS; revision history replaces git's version trail later. |
| Auth | **JWT** (Bearer) for admin; argon2 password hash | Stateless API; no tower-sessions in the split stack. |
| Database | **Postgres** via sqlx (runtime-checked queries, ADR-011) | FTS, relational features, pgvector later. |
| Hosting | Single VPS + **Caddy** + Docker Compose | Full control, cheap, good ops practice. |
| Newsletter | In MVP scope — double opt-in + send on publish | Subscribers from launch; real provider still TODO. |

---

## 2. Where we are (2026-06-28)

### ✅ Shipped — foundation & migration

| Layer | Done |
|---|---|
| **Backend API** | `GET /api/posts`, `/projects`, `/pages/:slug`, search, feeds, newsletter, comments API, admin CRUD, JWT login, image upload |
| **Render pipeline** | comrak + syntect, reading time, directive registry (`:::timeline`, `:::eyebrow`, `:::featured-*`, `:::uses-section`, `:::now-*`, `:::portfolio-projects`, …) |
| **Dev UX** | `just dev` (Postgres + migrate + seed + backend + frontend), auto `seed_missing` on debug startup |
| **Deploy artifacts** | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.prod.yml`, `Caddyfile`, CI workflows |

### ✅ Shipped — public site

| Route | Notes |
|---|---|
| `/` | CMS `pages/home` — hero + `:::featured-articles` / `:::featured-projects` slots |
| `/blog`, `/blog/:slug` | Two-column writing index; post shell with TOC, reading progress, prev/next |
| `/projects` | Grid + CMS project pages + **static case studies** (NotiQ, genuine.dev, db-labs) |
| `/about`, `/uses`, `/now` | Panel layout — TOC scroll-spy, reading progress (uses/now), Edit FAB |
| **Global** | Nav + ⌘K palette, 5 theme presets + accent picker, per-topic accents, light/dark, RSS/sitemap |

### ✅ Shipped — admin

- JWT login, dashboard (posts / projects / pages filters, stat cards)
- **3-panel editor**: file tree (posts · projects · pages/) · TipTap + tabs · Meta / Outline / Diagnostics
- Draft ↔ publish, delete, theme settings page (`/admin/settings/theme`)
- **Editable:** all CMS docs except static case-study slugs (hidden from project tree)

### 🔶 Partial / stubbed

| Feature | State |
|---|---|
| Newsletter | Subscribe + confirm API; **LogMailer** only — no Resend/SES yet |
| Comments | Backend + migration; **no public UI** wired |
| Theming | Presets in **localStorage** — not DB-backed owner themes |
| Search | Postgres FTS + Cmd-K; no tag landing pages yet |
| Media | Local upload dir; no S3 library / AVIF pipeline |
| Deploy | Artifacts written; **no verified VPS run** yet |

---

## 3. Architecture today

```
Browser ──▶ Next.js (SSR/CSR) ──fetch──▶ axum JSON API (:3001)
                                              │
                                    domain ← app ← infra
                                              │
                                         Postgres
```

- **Inbound adapter:** `backend/src/api/` — thin handlers, `ApiError` → HTTP.
- **Outbound adapters:** `infra/repo.rs`, `render.rs`, `auth.rs`, `mailer/`, uploads.
- **Frontend:** `frontend/app/` routes, `components/`, `lib/api.ts` (SSR uses `API_INTERNAL_URL`).
- **Prod:** Caddy → Next for pages, proxies `/api`, `/feed.xml`, `/uploads` → backend.

Detail: [ARCHITECTURE.md](ARCHITECTURE.md) · migration notes: [REACT-MIGRATION.md](REACT-MIGRATION.md).

---

## 4. Content pipeline

```
Admin editor (TipTap → markdown body + form fields)
        │  Save / Publish
        ▼
  MarkdownRenderer (comrak + syntect + directives)
        ▼
  documents table (body_markdown + body_html + metadata JSONB)
        │
  reads ▼
  Next.js pages (dangerouslySetInnerHTML on body_html + React shells for slots)
```

**Document kinds:** `post` · `project` · `page`

**Pages (kind = page):** `about`, `home`, `uses`, `now` — editable in admin under `pages/`.

**Static case studies:** React pages at `/projects/notiq`, `/projects/genuine-dev`,
`/projects/db-labs` — intentionally not CMS (bespoke layout + demo blocks).

**Seed:** `just seed` inserts missing docs; `just seed-refresh` re-renders all seed
content after directive changes.

---

## 5. Database model (Postgres)

Core tables (see migrations):

- **`documents`** — posts, projects, pages (`kind`, `slug`, `body_markdown`, `body_html`, `metadata`, `search_tsv`, …)
- **`tags`** + **`document_tags`** — tagging + per-tag accent colors
- **`users`** — single-owner admin
- **`subscribers`** — newsletter (email, status, tokens)
- **`comments`** — threaded-by-post comments (API ready)

Future tables (post-MVP): `document_revisions`, `media`, `themes`, `page_views`, `link_previews`, `reactions`.

---

## 6. Design system & pages

**Source of truth:** `docs/notiq_portfolio.html` + `docs/mockups/ui-ux-mockup.html` →
`frontend/styles/globals.scss` (CSS variables, panel rails, feat-cards, post-shell, …).

**Theming:** `[data-theme]` presets, `[data-topic]` accent overrides, boot script in
layout (no flash). Admin theme page previews all presets.

**Information architecture:**

| Route | Purpose |
|---|---|
| `/` | Hero + featured articles + featured projects |
| `/blog` | Article index, tag filter, search |
| `/blog/:slug` | Long-form post — TOC, progress, code, tags, prev/next |
| `/projects` | Project grid |
| `/projects/:slug` | CMS project **or** static case study |
| `/about` | Panel page — timeline directive |
| `/uses`, `/now` | Panel pages — gear list / status chips + live project cards |
| `/feed.xml`, `/sitemap.xml` | SEO feeds (Rust) |
| `/admin/*` | CMS |

---

## 7. MVP milestones — ✅ complete

| Phase | Delivers | Status |
|---|---|---|
| **0** | axum, config, tracing, Postgres, migrations, `/healthz` | ✅ |
| **1** | Renderer + `documents` schema + seed | ✅ |
| **2** | Public site — all core routes, search, feeds, responsive layout | ✅ |
| **2.5** | Admin auth + browser editor | ✅ (TipTap, multi-tab, file tree) |
| **2.7** | Newsletter subscribe + publish hook | 🔶 API done; real mailer pending |
| **3** | Docker + Caddy + CI/CD artifacts | 🔶 written; live deploy pending |
| **M1–M7** | React migration (ADR-013) | ✅ |

**You can write and publish today.** Remaining MVP gap: swap `LogMailer` for a real
provider and run one production deploy.

---

## 8. Suggested order from here

Pick phases by what teaches you most or demos best on the portfolio. Dependencies
noted inline.

1. **Phase 4a** — Rich rendering (Mermaid, KaTeX, callouts) — highest reader impact.
2. **Phase 4b** — Discovery (tag pages, series nav, related posts, OG images).
3. **Phase 5** — CMS depth (revisions, scheduled publish, media library, WebAuthn).
4. **Phase 6** — Engagement (comments UI, reactions, real newsletter).
5. **Phase 7** — Ops showcase (analytics, OTel, CSP, IaC) — great infosec content.
6. **Phase 8+** — Wow features (WASM playground, live demos, `/colophon`, digital garden).

---

## 9. Post-MVP: the over-engineering plan

> **Goal:** turn the portfolio into a "how did one person build this" showcase —
> and **master full-stack** doing it solo.

**Philosophy:**

1. **Rust where it teaches** — render pipeline, auth, email, search, SSRF-safe unfurl, WASM snippets compiled server-side.
2. **React where velocity wins** — editor UX, interactive demos, graph viz, theme builder.
3. **Frictionless tools for undifferentiated heavy lifting** — Caddy (TLS), giscus (comments v1), then rebuild as learning projects.
4. **One new stack layer per phase** — cumulative mastery.

Difficulty: ★ easy · ★★ moderate · ★★★ deep. Items marked **✅** are already shipped.

---

### Phase 4 — Reading & content experience ★

*Theme: make the blog itself world-class.*

| Feature | Status | Notes |
|---|---|---|
| TOC + scroll-spy (panel pages) | ✅ | `DocInteractive`, `useScrollSpy`, `[data-scroll-root]` |
| Reading progress bar | ✅ | Posts, CMS projects, case studies — not `/about` |
| Copy-code buttons | 🔶 | Verify on all code blocks |
| Callouts / asides / timeline | ✅ | Directives + TipTap insert bar |
| **Mermaid** diagrams | ⬜ | `:::mermaid` directive + client or server SVG |
| **KaTeX** math | ⬜ | `$...$` / `$$...$$` in renderer |
| Footnotes as hover popovers | ⬜ | Tufte-style sidenotes |
| Code filename + line highlight | ⬜ | syntect metadata + CSS |
| **Cmd-K palette** | ✅ | Instant search + nav |
| Tag landing pages `/tags/:tag` | ⬜ | Repo query exists; route missing |
| Series navigation | ⬜ | `metadata.series` seeded; no index UI |
| Related posts | ⬜ | Tag overlap → embeddings (Phase 10) |
| Dynamic **OG images** | ⬜ | `resvg` / `image` — per-post social cards |
| JSON Feed + per-tag feeds | ⬜ | Atom/RSS done |
| Link unfurl cards | ⬜ | SSRF-hardened OG fetch — *great infosec writeup* |

**Stack:** extend `render.rs` directive registry; React embeds for Mermaid/KaTeX;
`resvg` in infra.

---

### Phase 5 — CMS depth & identity ★★

*Theme: own your auth and authoring stack.*

| Feature | Status | Notes |
|---|---|---|
| JWT admin + TipTap editor | ✅ | Multi-tab, file tree, pages folder |
| Draft / publish workflow | ✅ | |
| Theme presets (visitor) | ✅ | localStorage — move to DB in this phase |
| **Revision history** | ⬜ | `document_revisions` table; diff view in admin |
| **Scheduled publishing** | ⬜ | Cron/worker + `published_at` in future |
| Autosave + conflict detection | ⬜ | Editor UX |
| **Media library** | ⬜ | S3/MinIO, AVIF/WebP, blur placeholders, picker in editor |
| **WebAuthn / passkeys** | ⬜ | `webauthn-rs` — flagship infosec feature |
| GitHub OAuth (optional) | ⬜ | Second login method |
| DB-backed **owner themes** | ⬜ | `themes` table + admin theme builder saves to API |
| Tiered visibility (patron drafts) | ⬜ | `visibility` column |

**Stack:** new migrations, `StorageBackend` port impl, `webauthn-rs`, TipTap media extension.

---

### Phase 6 — Engagement & community ★★

*Theme: make it two-way.*

| Feature | Status | Notes |
|---|---|---|
| Newsletter subscribe API | ✅ | |
| Double opt-in + send on publish | 🔶 | Needs real `Mailer` (Resend/Postmark/SES) |
| Comments API | ✅ | Wire UI + moderation queue |
| **giscus** (fast ship) | ⬜ | Or finish self-hosted comments |
| Reactions (clap/emoji) | ⬜ | Optimistic UI + `reactions` table |
| Webmentions (IndieWeb) | ⬜ | Receive + display under posts |
| Guestbook | ⬜ | `/guestbook` kind=page or separate table |

---

### Phase 7 — Observability, analytics & infra ★★★

*Theme: your infosec/ops playground.*

- **Privacy-first analytics** — self-hosted Plausible *or* roll your own `page_views` + dashboard (no cookies).
- **OpenTelemetry** → Prometheus + Grafana; structured logs; public **status page**.
- **Security hardening** — strict CSP + report endpoint, rate limits, `security.txt`, `cargo audit` in CI, signed images.
- **IaC** — Terraform + Ansible; staging env; backup restore drills.
- **Verified production deploy** — run the existing compose on VPS; document in INDEX.

*Write about all of this — meta content for an infosec blog.*

---

### Phase 8 — Interactive showcases ★★★

*Theme: portfolio that demonstrates skill.*

- **Rust WASM playground** — runnable snippets in posts (compile in browser or pre-built WASM).
- **Live project demos** — animated architecture diagrams, live metrics in case studies.
- **Dev-life integrations** — GitHub activity, WakaTime, "now playing", build badges on `/now`.
- **NotiQ block library** for CMS projects — `:::cards`, `:::matrix`, `:::tabs`, `:::accordion` (static case studies already hand-built; generalize as directives).
- **PDF resume generator** from DB content.

---

### Phase 9 — Real-time & social web ★★★

- WebSockets/SSE — live visitor count, live reactions, real-time comments.
- **POSSE** — auto-syndicate publishes to Mastodon / Bluesky / dev.to.
- Optional **ActivityPub** — follow the blog from Mastodon.

---

### Phase 10 — Intelligence layer ★★★

- **pgvector** semantic search + "ask my blog" RAG chatbot.
- AI TL;DR, auto-tagging, embedding-based related posts, generated OG art.
- Optional i18n.

---

### Phase 11 — Infosec specialization ★★

*Your niche — lean in.*

- CTF writeup system — spoiler reveals, challenge metadata, flag hints.
- Embedded mini-challenges (sandboxed puzzles on the site).
- `/security` page, PGP key, signed posts, "how this site is secured" meta post.

---

### Phase 12 — Performance, PWA & maturity ★★

- Edge caching, ETags, Brotli, `srcset`, View Transitions API, Lighthouse 100s.
- PWA — offline reading, installable, service worker.
- WCAG audit, keyboard nav (`j/k` posts, `?` shortcuts overlay).
- Promote to **Cargo workspace** crates when boundaries stabilize.

---

### Phase 13 — Digital garden ★★

- `[[wiki links]]`, backlinks, hover link previews.
- Growth stages 🌱→🌳, `note` kind, force-directed graph view, MOC index pages.

---

### Phase 14 — Reader delight ★★

- Reader prefs (font, width, focus mode, scroll restore).
- Listen-to-article (TTS), highlight-to-share quotes.
- Interactive explorables (Ciechanowski-style), micro-interactions.
- **In-browser terminal** — `ls posts`, `cat about` (NotiQ aesthetic).
- **curl-friendly** — `Accept: text/plain` → ASCII version of pages.

---

### Phase 15 — Colophon & personal pages ★

- `/colophon`, `/changelog`, `/bookshelf`, writing-stats dashboard.
- Image power-blocks — before/after slider, lightbox, blurhash.

---

### Full-stack mastery map

| Layer | Phases | You'll have built |
|---|---|---|
| Data | 0–1, 5, 10, 13 | Postgres, migrations, FTS, revisions, pgvector, graph indexes |
| Backend | 0–7, 11 | axum API, render directives, auth, email, SSRF-safe unfurl |
| Frontend | 2, 4–6, 8, 14 | Next.js SSR, TipTap, theming, interactive demos |
| Real-time | 9 | WebSockets, SSE, federation |
| AI | 10 | RAG, embeddings, streaming LLMs |
| DevOps | 3, 7 | Docker, Caddy, Terraform, CI/CD, observability |
| Security | 5, 7, 11 | JWT → passkeys, CSP, sandboxing, CTF UX |

---

## 10. Reference — detailed capability matrix

> **Note:** Sections **11–14** below retain the original deep-dive reference
> (capability matrix, DevOps tiers, hexagonal patterns, inspiration links).
> Stack names there (Leptos, maud, HTMX, tower-sessions) predate **ADR-013** —
> read them as **Next.js + Rust JSON API** equivalents. The *patterns* (ports,
> directives, theming tokens) are unchanged.

**Quick pointers:**

- Rich content matrix → §11
- Theming system detail → §11 (presets ✅ in Phase 2; DB themes → Phase 5)
- NotiQ block library → §11 (case studies ✅ static; directives → Phase 4/8)
- DevOps tiers → §12 (Tier 1 artifacts ✅; Tier 2 → Phase 7)
- Hexagonal / ports → §13 (implemented in `backend/src/{domain,infra,api}`)
- fasterthanlime / Josh Comeau inspiration → §14

---

## 11. Rich content & authoring — capability matrix

Explicit feature requests mapped to phase, approach, and tech. **Markdown stays
the canonical source** (stored in Postgres); every richer feature is a markdown
extension, an embed, or an editor block that *serializes back to markdown*.

| Capability | Phase | Approach / tech |
|---|---|---|
| **Markdown (GFM)** | 1 ✅ | `comrak` — body in editor; rendered on save. |
| **Code snippets** | 1–2 ✅ | `syntect` highlighting; copy button, filename, line highlight → 4. |
| **Directives / blocks** | 2–4 ✅/⬜ | `:::timeline`, `:::eyebrow`, featured slots ✅; Mermaid/KaTeX ⬜. |
| **Diagrams** | 4 | Mermaid client-side; KaTeX; optional D2 server → SVG. |
| **Images** | 4–5 | Upload → object storage; AVIF/WebP, `srcset`, lightbox. |
| **Video** | 4–5 | oEmbed + self-hosted `<video>`. |
| **Media library** | 5 | S3-compatible, dedupe by hash, editor picker. |
| **WYSIWYG editor** | 2.5 ✅ | TipTap markdown mode; upgrade to full WYSIWYG-serializes-to-md. |
| **Fast search** | 4 ✅ → 10 | Postgres FTS + Cmd-K ✅; pgvector semantic search. |
| **Tags** | 1–2 🔶 | DB + filter ✅; tag pages ⬜. |
| **Comments** | 6 | API ✅; giscus or self-hosted UI. |
| **Theming** | 2 ✅ → 5 | CSS vars; 5 presets ✅; DB owner themes ⬜. |
| **Responsive reading** | 2 ✅ | Panel rails, mobile nav, scrollable code. |

### Theming system (custom + saved themes)

A theme = named map of CSS token values. Presets ship in SCSS; custom owner themes
→ `themes` table (Phase 5). Per-topic accents via `[data-topic]` — seeded tag colors
+ `metadata.accent` overrides. Layering: base theme → topic → document → visitor accent.

### WYSIWYG decision (locked)

**Shipped:** TipTap with markdown serialization + live preview panels.
**Next:** slash commands, drag-drop media, dual raw/WYSIWYG toggle (Phase 5).

### End-goal: block/directive registry

The `Renderer` is a registry — each rich type is a handler. Editor insert bar emits
directives; render pipeline consumes them. **SSRF-safe link unfurl** is a deliberate
infosec showcase (allowlists, timeouts, no private-IP fetch).

### Project case-study system

Static pages (NotiQ, genuine.dev, db-labs) prove the design. **Phase 4/8** generalizes
NotiQ blocks (`:::cards`, `:::matrix`, `:::tabs`, `:::accordion`) as directives so
CMS projects can compose case studies without bespoke React per project.

---

## 12. DevOps & CI/CD

Two tiers: **Tier 1 (MVP)** — CI fmt/clippy/test, Docker images, compose deploy ✅ artifacts written.
**Tier 2 (Phase 7)** — Terraform, Ansible, canary, SBOM, restore drills.

Local: `just dev` · `just check` · `just seed-refresh` after directive edits.

---

## 13. Architecture & extensibility — patterns & principles

Hexagonal layout — dependencies point inward. Ports at known seams:

| Port | MVP impl | Future |
|---|---|---|
| `ContentRepository` | Postgres ✅ | read replica |
| `Renderer` | comrak+syntect ✅ | + Mermaid/KaTeX/unfurl |
| `StorageBackend` | local FS 🔶 | S3/MinIO |
| `SearchBackend` | Postgres FTS ✅ | pgvector, Meilisearch |
| `AuthProvider` | JWT + argon2 ✅ | WebAuthn, OAuth |
| `Mailer` | LogMailer 🔶 | Resend/SES |
| `ThemeProvider` | client presets ✅ | DB themes |

Event bus (`DocumentPublished`, …) — start with `tokio::broadcast`, grow to outbox + worker.

Anti-patterns: no microservices, no trait with one impl and no roadmap, no infra types past adapters.

---

## 14. Inspiration — fasterthanlime-grade over-engineering

| Idea | Phase |
|---|---|
| Character asides (`:::bear-tip`) | 4 |
| Rich custom directives | 4 ✅ started |
| Server-side syntect + line annotations | 1 → 4 |
| Content-addressed assets | 5, 12 |
| Tiered/gated content | 5 |
| Strong series navigation | 4 |
| Live-reload authoring | dev → 9 |
| Streaming HTML | 12 |
| Observability as blog content | 7 |
| Self-hosted infra | 3, 7 |

Also: [joshwcomeau.com](https://www.joshwcomeau.com) (delight), [ciechanow.ski](https://ciechanow.ski)
(explorables), [maggieappleton.com](https://maggieappleton.com) (digital garden),
IndieWeb/webmentions, Tufte sidenotes.

**Highest-leverage next build:** Mermaid + KaTeX directives (Phase 4) — visible on
every technical post, forces a clean registry, and matches what readers expect from
a systems blog today.
