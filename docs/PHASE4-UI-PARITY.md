# Phase 4 — Full UI/UX parity with `ui_mockups.html` + NotiQ

**Goal:** bring the *live* site up to everything in `docs/ui_mockups.html`, and make
every existing endpoint match the NotiQ theme (`docs/notiq_portfolio.html`).
This consolidates roadmap §11 (rich content, theming, project blocks) into a
concrete, ordered build. **Planned 2026-06-28.**

## Gap analysis (mockup → live)

| Area | In `ui_mockups.html` | Live now | Gap |
|---|---|---|---|
| Nav | pill nav + **5 theme presets** + **accent picker** | pill nav + light/dark only | presets, accent picker, per-topic |
| Home | hero + **meta pills** + 5-color **divider** + **featured cards** (writing + projects) | eyebrow/headline/lead + search + post rows | meta pills, divider, featured project cards, richer card layout |
| Blog | search + **tag filter pills** + rows w/ summary + tags | search + rows (date/title/min) | tag pills, summaries, tags on rows |
| Post | **TOC** (scroll-spy) · code **copy** + filename + line-highlight · **character aside** · **callouts** · **prev/next** · **comments** | title + meta + prose (syntect) | all of these |
| Projects | cards w/ **colored border + tags + links** | cards (title + summary) | borders, tags, links |
| Project detail | **NotiQ blocks**: arch SVG, service cards, comm matrix, tabs, accordions, ER | markdown render | the whole block library |
| About | avatar + **timeline** + skills chips | markdown render | timeline/avatar/skills components |
| Cmd-K | **command palette** (instant fuzzy search + actions) | basic search box | the palette |
| Design system | tokens + component showcase screen | — | optional `/design` page |
| Theming | 5 presets · accent picker · **per-topic accents** (`data-topic`) | light/dark | presets, accent, per-topic |

## Sub-phases (ordered)

### 4a — Theming system (presets + accent + per-topic)
- Port all 5 `[data-theme]` presets (dark/light/midnight/sepia/matrix) + 6
  `[data-topic]` accent blocks into `style/main.css`.
- Nav: theme-preset swatches + custom accent `<input type=color>` + reset; extend the
  shell `THEME_JS` to apply preset + custom accent before paint (no flash), persist to
  `localStorage`.
- Per-topic accents: `tags.accent` column (migration); set `data-topic` on the article
  root from the post's primary tag.

### 4b — Component library (NotiQ components as Leptos components)
- `hero` (eyebrow + accent headline + lead + **meta pills** + 5-color divider),
  `meta_pill`, `chip`/`tag`, `card` (colored border + tags + links), `section_label`.
- Apply to home (featured writing **cards** + featured projects), projects index
  (borders + tags + links), about (avatar + **timeline** + skills).

### 4c — Tags + reading experience
- `document_tags` read/write; tag pills on posts/cards; **tag filter** on blog;
  **`/tags/:slug`** pages.
- Post detail: **TOC** generated from headings (+ scroll-spy), code **copy buttons** +
  filename + line-highlight, **prev/next** post nav.

### 4d — Rich-content directives (the `Renderer` block registry)
- Extend `MarkdownRenderer` with a directive pass: **character aside** (your persona),
  **callouts** (`:::note` / `:::warn`), **spoilers**, plus **Mermaid** + **KaTeX**.
- This is the mechanism every rich block plugs into (sets up 4e).

### 4e — NotiQ project case-study blocks
- Directives: `:::cards` (service cards), `:::matrix` (comm table), `:::tabs`
  (engineering depth), `:::accordion` (build narrative), `:::grid` (infra),
  `:::signals` (decisions); Mermaid for architecture + ER diagrams.
- Compose `/projects/notiq` from these so it renders the full case study.

### 4f — Cmd-K palette + consistency pass
- **Cmd-K** command palette: instant fuzzy search (posts/projects/tags) + actions
  (toggle theme, navigate), keyboard nav.
- Audit **all endpoints** (home, blog, post, projects, about, admin, login, 404,
  newsletter) for NotiQ-token + mockup-layout consistency + responsive. Optional
  internal `/design` page mirroring the mockup's design-system screen.

## Architecture notes (stays consistent with what's built)
- **Directives** live in the `Renderer` port — additive, markdown stays canonical
  (no data-model change; aligns with ADR / §11 + the "no Notion block-table" decision).
- **Components** are plain Leptos components reusing the CSS tokens already in
  `style/main.css` (ported from NotiQ).
- **Theming** is pure CSS variables + `data-theme`/`data-topic` + the shell boot script.
- **Cmd-K** is a small client island (Leptos + a keydown listener) over the existing
  `search_posts` server fn.

## Suggested order
4a (theming) → 4b (components, makes every page look right) → 4c (tags + reading) →
4d (directive engine) → 4e (NotiQ blocks) → 4f (Cmd-K + consistency).

> Build incrementally; verify each sub-phase (build + curl/visual) and log it in
> `CHANGELOG.md` per the doc discipline. `ui_mockups.html` is the visual spec.
