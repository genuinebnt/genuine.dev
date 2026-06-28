# Build state — resume here

Living "where we are" doc. Update when a milestone completes.
**Last updated: 2026-06-28.**

## Current position — ✅ MVP + React migration complete

**Stack (ADR-013):** Rust axum JSON API (`backend/`) + Next.js 16 + React 19 (`frontend/`).

The Leptos MVP (Phases 0–3) was fully built, then migrated per
[REACT-MIGRATION.md](REACT-MIGRATION.md). All domain/infra/render/auth logic reused
behind the JSON API.

### Run locally

```bash
just dev    # Postgres + migrate + seed + backend :3001 + frontend :3000
```

Admin: http://localhost:3000/admin/login — `admin` / `admin`

If `/` 404s after pulling new page seeds: `just seed` or restart backend (debug builds
auto-run `seed_missing` on startup).

### Shipped (high level)

- **Public:** `/`, `/blog`, `/projects`, `/about`, `/uses`, `/now`, static case studies, Cmd-K, theming, RSS/sitemap, search
- **CMS pages:** `pages/home`, `about`, `uses`, `now` — panel shells + directives
- **Admin:** JWT, dashboard, TipTap multi-tab editor, pages/ folder, theme settings
- **UX polish:** reading progress, TOC scroll-spy, nav → "Articles", dependency refresh (Next 16)

### Partial / next

| Item | Status |
|---|---|
| Real email provider (newsletter) | LogMailer stub |
| Comments UI | API only |
| Tag landing pages | Not routed |
| Mermaid / KaTeX | Not in renderer |
| Production deploy | Artifacts exist; no verified VPS run |
| ARCHITECTURE.md diagrams | Still describe Leptos layer — refresh pending |

### Plan from here

See [ROADMAP.md](ROADMAP.md) §8–§9 — phased over-engineering plan with ✅/⬜ status
on each feature. Suggested first picks: **Phase 4** (Mermaid, KaTeX, OG images, tag pages)
then **Phase 5** (revisions, media library, WebAuthn).

### Quality gate

```bash
just check              # fmt + clippy + test (backend)
cd frontend && npm run lint && npm run build
```
