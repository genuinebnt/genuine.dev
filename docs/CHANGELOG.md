# Changelog — genuine.dev

Dated timeline of everything added to the project. Newest first.
Format: each entry is `what` (+ `why` when not obvious). Planning artifacts and
code changes both go here so the history is complete.

---

## 2026-06-29 — Collapsible sidebars

- **Admin settings rail collapses to icons-only** (`AdminSettingsShell` +
  `AdminSettingsNav`): a `«`/`»` toggle, persisted in `localStorage`
  (`adminNavCollapsed`). Reworked sizing to proper icon-rail proportions — larger
  icons/labels, a 66px collapsed strip with inset rounded hit areas, and `title`
  tooltips so labels are still reachable. Mobile keeps the horizontal chip nav.
- **Content rails collapse too** — post TOC, writing/projects filters, and the
  about profile. A self-contained `RailToggle` (in `components/ui/`) flips
  `rail-collapsed` on the closest `[data-rail-shell]` and persists per-rail, so it
  works inside both server (post/about) and client (writing/projects) shells.
  Collapsing hides the rail to a thin strip with a reopen chevron, giving the main
  column full width. Desktop-only (≥761px); the toggle is hidden on mobile.
- *Design note:* icon navs collapse to icons (admin); content rails collapse to a
  hide/show strip — the right pattern for each rather than forcing icons onto
  text-only rails.

## 2026-06-28 — UI fixes + session theme + mockup polybar screens

- **Side-panel scrollbars hidden:** the panel-page rails (`.about-sidebar`,
  `.toc-col`, `.proj-filter`, `.filter-col .fc-body`) scrolled independently and
  showed the default browser scrollbar right next to the main column's — now
  hidden via `ui-scrollbar-hidden` (still wheel/trackpad scrollable). Added
  `.post-list`/`.projects-scroll` to the thin `ui-scrollbar` set.
- **Home 5-colour divider spans the full shell:** the hero block no longer caps
  its whole width at 680px; only the hero *text* (eyebrow/h1/meta-row/lead) is
  capped, so `.divider5` (and the grids below) go full-width.
- **Two-tier theme persistence (`lib/theme.ts`):** the navbar polybar theme/accent
  picker now applies a **session-only** override (`sessionStorage`) that resets on
  a new session; admin theme settings remain the **permanent** default
  (`localStorage`), and an admin save clears any session override. Resolution order
  is session → permanent → system; boot-script DOM setters are now DOM-only so a
  session theme never leaks to `localStorage`. Wired `PolybarAppearance` +
  `PolybarThemePreview` to the session helpers.
- **Mockup (`docs/mockups/ui-ux-mockup.html`):** added **Polybar tray** and
  **Admin — polybar** screens (collapsed rail + expanded tray + widget reference;
  widget enable/rail/order settings table). Synced the admin settings left-nav
  (content: Posts/Projects/Scheduled · site: Theme/Settings/Polybar/Analytics) and
  noted the permanent-vs-session theme model on the Theme screen.

## 2026-06-28 — Polybar notification click fix

- Notification dropdown items use `router.push` + mark-read instead of `<Link onClick={close}>`; outside dismiss listens on `click` (not `mousedown`) and the rail pill allows overflow while open so the panel receives pointer events.

## 2026-06-28 — Schedule picker year chip click fix

- Portaled panel clicks no longer race the window outside-click handler; year chip opens the year grid reliably.

## 2026-06-28 — Schedule picker month/year grids

- Header chips open 4×3 month and year grids; year view pages by 12 with ‹ › navigation.

## 2026-06-28 — Schedule picker size and placement

- Calendar panel fixed at 248px, centered under the trigger with viewport clamping; tighter cell padding and controls.

## 2026-06-28 — Custom schedule calendar panel

- `ScheduleDateTimeInput` opens a site-styled calendar + time panel (portal, mono/surface tokens) instead of native browser date/time popups or split fields.

## 2026-06-28 — Schedule date/time picker component

- Replaced native `datetime-local` with split date + time fields (`ScheduleDateTimeInput`) using `.mf-input` / `.fg-input` — matches kind/status row pattern and site form tokens.

## 2026-06-28 — Datetime picker design-system styling

- `datetime-local` inputs in editor meta + publish modal use mono/surface tokens, theme-aware `color-scheme`, and webkit edit-field styling; modal fields use full `.fg-input` (was width-only) per ui-ux mockup.

## 2026-06-28 — Admin notification WebSocket push

- `NotificationHub` (tokio broadcast) emits `new` and `refresh` events on insert and mark-read; scheduler and REST handlers wired through shared `AppState`.
- `GET /api/admin/notifications/ws?token=JWT` streams hub events to logged-in admins.
- Polybar bell connects over WebSocket with exponential reconnect; polls every 2 min only when the socket is down.

## 2026-06-28 — Polybar collapsed rail slimming

- Scoped expanded-tray clock column layout to `.nav-tray-widget.nav-tray-clock` so the collapsed rail cell no longer inherits min-width, padding, or vertical stack — rail pill stays a single ~26px row.
- Expanded tray clock uses two rows (time + `date · tz` meta line) instead of three stacked lines; rail compact clock stays single-line with explicit `line-height: 1`.

## 2026-06-28 — Polybar clock spacing

- Expanded tray clock stacks time, date, and timezone as three sibling lines with larger gaps and min-width so the block doesn’t crush together.

## 2026-06-28 — Admin notifications + scheduled publish worker

- `notifications` table and JWT API (`GET /api/admin/notifications`, mark read / mark all read).
- Background worker publishes drafts when `metadata.scheduled_for` is due and inserts a `scheduled_published` notification linking to the live doc.
- Polybar **◔** bell (logged-in admin) opens a dropdown panel with unread badge; configurable in Admin → Polybar.

## 2026-06-28 — Reading measure width + title wrap

- Narrow/wide/focus measures use px caps (720px / 860px) instead of `ch` — `ch` underruns for large titles. Flex column children get `min-width: 0` so titles wrap instead of overflowing the column.

## 2026-06-28 — Reading column alignment, measure, focus mode

- Narrow measure widened to 65ch (was 58ch); focus mode on default width uses 68ch. One flex-centered column aligns title, meta, and prose; section `#` anchors no longer indent headings.
- Focus mode hides article/about/now/uses sidebars and single-columns the layout so the reading stack centers without the TOC rail.

## 2026-06-28 — Narrow/wide reading measure centering

- `--read-measure` centers title, meta, cover, prose, related, prev/next, and comments in article layouts — not just `.prose` left-aligned in a wide column.

## 2026-06-28 — Editor list / checklist spacing

- ProseMirror `ul`/`ol` regain left indent after global reset (bullets no longer sit in/over content padding); diag/publish check rows wrap long text.

## 2026-06-28 — Editor cancel, tabs, code highlighting

- Editor status bar adds Cancel (discards unsaved with confirm, returns to `/admin`); tab links no longer underline filenames; tab bar and in-block horizontal scrollbars hidden where redundant.
- Code fences use lowlight syntax highlighting in edit mode; toolbar shows language + optional filename when a block is focused.

## 2026-06-28 — Nav clock + article tag rail spacing

- Polybar clock stacks time, date, and timezone vertically with clearer gaps; article sidebar tag chips sit further below the "Tags" label.

## 2026-06-28 — Polybar clock hydration fix

- `PolybarClock` defers live time/date until client mount (static placeholder on SSR); fixed `en-GB` locale avoids Node vs browser date string mismatch.

## 2026-06-28 — Code fence line number alignment

- Removed legacy `.code .hl { display: block }` rule that broke grid/flex on `.code-line.hl` (highlighted lines had misaligned gutters).
- Code lines use flex gutter (`.ln` + `.code-txt`) matching mockup; empty lines render `&nbsp;` so row height stays consistent. Run `just seed-refresh`.

## 2026-06-28 — Code fence copy attribute fix

- Code blocks: flex line gutter (`.ln` + `.code-txt`), dynamic width for line numbers, trimmed trailing newline — fixes misaligned line numbers. Run `just seed-refresh`.

## 2026-06-28 — Articles/projects pagination + code block UI

- Articles pager now shows at 10/page (15 seed posts → 2 pages); projects at 2/page with `?page=` URL sync and sticky footer bar.
- Code fence highlights apply to `.code-line.hl` (no broken wrapper); theme boot via `next/script` `beforeInteractive` (fixes layout dev error).
- Run `just seed-refresh` after pulling renderer change to re-render stored HTML.

## 2026-06-28 — Admin content layout gutters

- `/admin` content table back in padded `shell` layout (was `panel-fullbleed`, flush to viewport edge); settings/editor shells unchanged.

## 2026-06-28 — Seed articles expanded

- Added 11 blog seed posts (distributed, systems, infosec, rust) — 15 total; run `just seed-refresh` to upsert into an existing DB.

## 2026-06-28 — About sidebar, admin toolbar, layout script

- `/about` sidebar shows profile rail plus “On this page” TOC (h2/h3 from CMS HTML) with scroll-spy; `extractPanelSections` reads Comrak anchor ids; replaced `AboutShell` with `AboutDocPage`.
- Admin content header uses `.admin-toolbar` so search and Settings/New/Logout wrap cleanly; admin routes drop the public footer (panel shell).
- Theme boot script moved to a native `<script>` in `<head>` to fix Next.js “script tag while rendering” dev warning.

## 2026-06-28 — Project row spacing

- `/projects`, home selected projects, and `/now` roadmap/reading rows use `--grid-gap` (10px) between stacked panel rows; roadmap items are bordered cards instead of a flush border list.

## 2026-06-28 — /now roadmap progress

- Added `:::now-progress` directive (roadmap bars + optional `# title` label) and aligned `/now` seed copy with the UI mockup — status cards, four-project progress, Learning/Reading/Fitness/Not doing sections. Run `just seed-refresh` to update an existing DB.

## 2026-06-28 — UI mockup sync

- Updated `docs/mockups/ui-ux-mockup.html` to match shipped app: WYSIWYG editor, unified `/admin` (bulk bar, seed-aligned stats/tags, pagination), `/blog` with four seed posts, publish modal metadata checks, `/blog/[slug]` URLs, Cmd-K tags group, JWT login hint.

## 2026-06-28 — Seed metadata topics

- All seed posts and projects now set `metadata.topic` (rust, infosec, systems, distributed) alongside tags — run `just seed-refresh` to update an existing DB.

## 2026-06-28 — List pagination

- Shared `Pagination` component + `lib/pagination` helpers.
- Admin content table (20/page, `?page=`), writing index (15/page), projects list (10/page). Pager hidden when a list fits one page.
- Admin table rows: 3px topic/portfolio accent bar (same derivation as writing index: topic or first tag).

## 2026-06-28 — Admin table polish

- Topic column uses explicit `metadata.topic` (tags stay in title row); scheduled dates use blue styling.
- Slug moved out of tag pills; static portfolio rows show a `static` badge, `view` only, no bulk select/delete.

## 2026-06-28 — Admin content filters

- Removed duplicate status/kind chip row; stat cards remain the primary filters.
- Tag filter chips (and clickable row tags) derive from `metadata.tags` on loaded documents only.

## 2026-06-28 — Frontend lib tests + onboarding comments

- Vitest coverage for `adminDocs`, `editor/formState`, and `editorDiagnostics` (scheduling contract, dirty tracking, link/heading checks).
- Module-level comments on non-obvious editor/admin contracts; `just check` runs frontend tests.

## 2026-06-28 — Frontend refactor (S-tier maintainability)

- Split `EditorForm` into `editor/*` modules; moved form state, diagnostics, reading stats, admin helpers, and auth/admin API into focused `lib/` files.
- Unified scheduling via `metadata.scheduled_for`; full `isEditorDirty`; single `useComments` provider (no double fetch).
- Shared `EditorCheckRow`, `TOPIC_KEYS`, indexed Cmd-K sections, curated publish checklist.

## 2026-06-28 — Mockup gap fill (keep existing overrides)

- **Publish modal**: Pre-publish checklist, Now vs Schedule (stores `metadata.scheduled_for` as draft), canonical URL, jump-to-editor on warnings — TipTap/WYSIWYG unchanged.
- **Editor diag/outline**: Empty-heading checks, internal link resolution, code fence tags, jump-to-heading, directives/blocks in outline, file-tree collapse, line count in status bar.
- **Admin list**: Search bar, topic/date/tag columns, topic filter chips, scheduled stat (from `scheduled_for` metadata) — unified `/admin` + bulk select kept.
- **⌘K**: Tags result group → `/blog?tag=…`.
- **Post comments**: Mockup `art-comments` styling; comment count in meta row via `CommentMeta`.
- **Login**: Session hint matches JWT-in-localStorage (not cookie).
- **API**: `AdminItem` includes `published_at` + `metadata` for admin table.

## 2026-06-28 — Selection controls match mockup

- Replaced native checkboxes/toggles with design-system **`UiCheckbox`** (admin bulk select, editor featured) and **`UiPillToggle`** on/off pills (polybar settings); settings fields use **`mf-input`** styling.

## 2026-06-28 — Reader + admin polish bundle

- **Reader**: Heading `#` copy links, image lightbox, `#L12` code line flash, related posts + series prev/next (API), Mermaid/`:::math` directives + client KaTeX, reading width prefs, focus mode, print stylesheet, view transitions.
- **⌘K**: Recent docs, copy URL, focus mode, admin link, blog topic filters, `?` shortcuts overlay.
- **Polybar**: Status line widget, timezone clock, pomodoro notifications, presets (Minimal/Writer/Demo).
- **Admin/editor**: Bulk publish/delete, duplicate doc API, local autosave recovery, live slug URL, scheduled status option, editor ⌘S / ⌘⇧P / ⌘⇧L.
- **Settings**: Status line + timezone + reading width; theme JSON import/export; per-page override modal.
- **SEO**: Open Graph / Twitter metadata on blog posts.

## 2026-06-28 — Admin settings hub + unified sidebar

- **`/admin/settings`**: Settings index (Theme, Polybar cards; Analytics placeholder) matching mockup site nav.
- **`AdminSettingsNav` / `AdminSettingsShell`**: Shared left rail for all settings pages — full content links, session footer, panel-rail width; settings routes use `panel-fullbleed` like other sidebar pages.
- **Admin header**: Single ⚙ Settings link replaces separate Theme/Polybar buttons.

## 2026-06-28 — Polybar search icon in pill

- **`PolybarSearch`**: ⌕ only (circular, no ⌘K label) inside the unified polybar pill with other widgets; respects admin order.

## 2026-06-28 — Search in polybar

- **`PolybarSearch`**: Command palette trigger is a polybar widget (enable/rail toggle in admin); removed standalone nav ⌘K and `searchInNav` setting.

## 2026-06-28 — Polybar collapsed rail

- **Nav polybar**: Enabled widgets default to compact controls in the collapsed nav rail (`showCollapsed` per widget in admin); expanded tray still shows full widgets. Timers share state via `PolybarProviders`.

## 2026-06-28 — Polybar tray polish (overflow, scroll, toggle)

- **Nav polybar**: Expanded tray floats over the nav (no row spill); touch/trackpad scroll when widgets overflow with **hidden** scrollbar. Toggle always shows **‹** and stays above the tray when open.

## 2026-06-28 — Polybar UI consistency (mockup alignment)

- **Polybar widgets**: Shared `ft-btn` / `meta-pill` controls; light/dark shows ◑/◐ + label; removed other tray uppercase labels. Nav ⌘K/search match mockup `.kbd`; tray uses mockup surface/border tokens.

## 2026-06-28 — Admin-controlled polybar widgets

- **`/admin/settings/polybar`**: Toggle and reorder nav tray widgets (clock, light/dark preview, theme swatches, pomodoro, countdown); optional ⌕ search button in nav instead of plain ⌘K. Settings in `localStorage` (`polybarSettings`); `NavPolybar` + `Nav` react via `polybar-config-updated`.

## 2026-06-28 — Nav polybar utility tray (clock + theme)

- **`NavPolybar`**: Modular expandable tray — `PolybarClock` (live time/date) + `PolybarThemePreview` (non-persisting theme/accent). Toggle shows compact clock + ◑ when collapsed; add widgets as cells in `nav-tray-inner`.

## 2026-06-28 — Nav polybar theme preview tray

- **`NavThemeTray`**: Expandable ‹/› polybar on the nav (public pages) — theme presets, accent swatches, custom color, ⟲ restore saved. Preview only (`previewTheme` / `previewAccent`); persists via `/admin/settings/theme` only.

## 2026-06-28 — Admin filters, preview parity, themed scrollbars

- **Admin dashboard**: Stat cards (published, drafts, projects, pages) now filter the table; filter chips use proper buttons with active/hover states. URL params `?kind=` / `?status=` pre-select filters.
- **Editor preview**: Split preview calls `POST /api/admin/preview` (same comrak+syntect+directives pipeline as publish) instead of client `marked` — callouts, code highlighting, and directive blocks match production. Topic accent applied via `data-topic`.
- **Scrollbars**: Global theme-aware thin scrollbars (muted thumb, accent on hover) across editor, panels, cmd-k, and main content.

## 2026-06-28 — Admin publish, theme save, directive delete fixes

- **Publish**: Editor "Publish" now forces `status: published` (was saving whatever the meta dropdown showed, often draft). Save flushes latest TipTap markdown; API returns `{ slug }` for new docs.
- **Theme**: Admin theme preview no longer writes localStorage until Save; Discard restores last saved snapshot. Projects page default override no longer hardcodes midnight — inherits site theme.
- **Editor**: Callout/aside blocks get a Remove control; atom directives can be deleted in edit mode.

## 2026-06-28 — Roadmap redesign + dev seed on startup

- **`docs/ROADMAP.md`**: Rewritten for ADR-013 stack (Next.js + Rust API); §2 shipped inventory; §9 post-MVP phases with ✅/⬜ per feature; trimmed stale Leptos/maud references in §1–§9.
- **`docs/BUILD-STATE.md`**, **`docs/INDEX.md`**: Updated run instructions (`just dev`) and current position.
- **`just dev`**: Now runs `seed` after migrate so new page docs (`home`, `uses`, `now`) appear without a manual step.

## 2026-06-28 — Landing page CMS (`pages/home`)

- **Home (`/`)**: Hero copy, meta pills, and section labels editable in admin; featured article/project grids still pull `featured: true` items from the API via `:::featured-articles` / `:::featured-projects` slots.
- **Seed**: `pages/home` document — run `just seed-refresh` to populate.

## 2026-06-28 — `/uses` and `/now` CMS-backed pages

- **Backend directives**: `uses-section`, `now-status`, `now-chips`, `now-reading`, `portfolio-projects` for panel page markdown.
- **Seed**: `pages/uses` and `pages/now` documents; run `just seed-refresh` to populate.
- **`PanelDocPage` / `NowDocPage`**: TOC scroll-spy, Edit FAB, CMS body; `/now` still injects live portfolio cards at `:::portfolio-projects`.

## 2026-06-28 — Admin: pages in editor + case study guard

- **Editor file tree**: `pages/` folder (e.g. about) alongside posts and projects; portfolio case-study slugs hidden from project tree (static React pages).
- **Admin dashboard**: `pages` filter + stat card; case-study rows show “static case study” instead of edit; preview/view links respect doc kind.

## 2026-06-28 — Nav label: Writing → Articles

- **Nav, blog index sidebar, about link, theme admin preview, home featured section, post prev link**: User-facing blog section renamed to **Articles** (route stays `/blog`; internal theme key `writing` unchanged).

## 2026-06-28 — Reading progress scope

- **`/about`**: Removed reading progress bar (reference page, not long-form article).
- **Portfolio case studies** (`/projects/notiq`, `/projects/genuine-dev`, `/projects/db-labs`): Added via `PortfolioPageShell`. CMS project pages via `DocArticle` already had it.

## 2026-06-28 — Panel scroll-spy for sidebar TOC

- **`DocInteractive` / `useScrollSpy`**: IntersectionObserver now uses the panel scroll column (`[data-scroll-root]`) instead of the viewport; TOC hash clicks scroll inside that column.
- **`/now` and `/uses`**: Sidebar highlight follows scroll again; section links scroll the body panel.

## 2026-06-28 — Reading progress bar visibility

- **`ReadingProgress`**: Portaled to `document.body` so `panel-fullbleed { overflow: hidden }` no longer clips the fixed bar; scroll tracking prefers `[data-scroll-root]` and the largest scroll column (not the sidebar rail).

## 2026-06-28 — About page hydration + theme boot script

- **`AboutShell`**: Stopped splitting timeline HTML in React (regex matched the first nested `</div>`, corrupting server markup vs client tree). Timeline section label now comes from the backend `:::timeline` renderer.
- **`layout.tsx`**: Theme boot moved to `next/script` with `beforeInteractive` — fixes React 19 “script tag while rendering” warning.
- **Re-seed**: Run `just seed-refresh` so stored about-page HTML picks up the renderer change.

## 2026-06-28 — Frontend and backend dependency refresh

- **Next.js 16** (`^16.2.9`), React 19.2, ESLint 9 flat config (`eslint.config.mjs`), TypeScript 5.9, TanStack Query 5.101, Sass 1.101 — frontend stack brought current without jumping to ESLint 10 / TS 6 majors.
- **Removed `experimental.devtoolSegmentExplorer`**: Option dropped in Next 16; stale `.next` cache still cleared via `npm run clean`.
- **Editor toolbar**: Image upload uses a `<label>` file picker (no ref click) for React 19 `react-hooks/refs` lint compatibility.
- **Backend `Cargo.lock`**: Already at latest within semver ranges (`axum` 0.8.9, `tokio` 1.52, `sqlx` 0.8.6, `comrak` 0.52, `syntect` 5.3).

## 2026-06-28 — Next.js stability and lint setup

- **`experimental.devtoolSegmentExplorer: false`**: Prevents dev-only SegmentViewNode / client manifest errors after HMR (500s on `/about` etc.) — superseded by Next 16 upgrade (option removed).
- **`npm run clean` / `just frontend-clean`**: Clears stale `.next` cache when webpack module errors appear in dev.
- **ESLint**: Migrated to flat config + `eslint-config-next@16`; `npm run lint` runs `eslint .` directly.
- **`ProjectCard`**: Fixed invalid nested `<a>` tags (card stretch link + external links as siblings).
- **Fonts**: Kept Google Fonts `<link>` in layout (build env cannot reach fonts.googleapis.com for `next/font` fetch).

## 2026-06-28 — Unified panel sidebar rail width

- **`--panel-rail` / `--panel-rail-pad`**: Writing, posts, projects, now, and uses sidebars now match the about page rail (`240–280px`, `24px 20px` padding) instead of the old `180–200px` narrow rails.
- **Panel rail typography**: Shared `--panel-rail-*` tokens bump sidebar labels, links, and section headers ~1px so text scales with the wider rail.

## 2026-06-28 — Frontend/backend maintainability pass

- **`lib/projects.ts`**: Single source for portfolio slugs, routes, accents, status, and rainbow divider colors; legacy re-exports kept in `projectLinks` / `projectStatus`.
- **`lib/metadata.ts`**: Typed metadata accessors replace repeated casts across list pages.
- **`ProjectCard` + `components/portfolio/*`**: Shared card and case-study blocks dedupe `/projects`, `/now`, and three portfolio pages.
- **`NowPage`**: Fetches projects from API instead of hardcoded status/color duplicates.
- **`content.rs`**: `content_repo` / `published_doc` helpers remove repeated repository wiring.

## 2026-06-28 — Portfolio UI consistency pass

- **db-labs**: Removed status badges, hero Status pill, and ✅/🔄 icons from coverage table — learning project, not a ship checklist.
- **Case studies**: Aligned hero meta pills (no Status on portfolio pages) and `divider5` spacing (32px) across NotiQ, genuine.dev, db-labs.
- **Projects index / home**: Per-slug accent bars (`notiq` / `genuine-dev` / `db-labs`); status badges only when seed metadata sets `status`.

## 2026-06-28 — `just seed-refresh` upserts existing seed slugs

- **`seed_refresh`**: `just seed` still skips existing rows; `just seed-refresh` re-renders and upserts all seed documents (preserves ids + published_at).

## 2026-06-28 — db-labs framed as portfolio project

- **`/now`**: Replaced roadmap progress bars with portfolio project cards (NotiQ, genuine.dev, db-labs). db-labs is current build focus.
- **`/projects/db-labs`**: Case study reframed — BusTub build phases (P0–P4) instead of CMU curriculum roadmap; portfolio-style hero and signals.

## 2026-06-28 — Rename genuine-folio → genuine.dev

- **Rust crate** `genuine-dev` (was `genuine-folio`); `just dev` / Dockerfile / prod image names updated.
- **Frontend package** `genuine-dev-frontend`; `/now` and docs use genuine.dev branding.
- **Legacy** `/projects/genuine-folio` still redirects to `/projects/genuine-dev`.

## 2026-06-28 — db-labs portfolio case study

- **`/projects/db-labs`**: Third rich project page — CMU 15-445 disk-oriented architecture, engine components, five-phase roadmap accordions, engineering tabs, milestones, page layout diagram, and signal list. Content sourced from `~/projects/db-labs/ROADMAP.md`.
- **Seed + routing**: `db-labs` project in seed (featured, GitHub link); `projectLinks`, `[slug]` redirect, and Cmd-K use portfolio route.

## 2026-06-28 — Portfolio case studies: typography + rich genuine.dev page

- **Portfolio CSS**: Tighter measure (1000px shell), smaller hero/title/lead/pills — NotiQ and case-study pages no longer read oversized vs mockup.
- **`/projects/genuine-dev`**: Expanded to match NotiQ depth — architecture SVG, 8 service cards, comm matrix, 5 phase accordions with decision grids, engineering tabs + concept grid, platform coverage, schema ERD, stack grid, and signal list.

## 2026-06-28 — Typewriter `genuine.dev` wordmark

- **`TypewriterBrand`**: Nav + login logo types out `genuine.dev` with a blinking shell cursor, then hides the cursor after completion; runs once per browser session; respects `prefers-reduced-motion`.

## 2026-06-28 — Reading progress tracks panel scroll containers

- **`ReadingProgress`**: Listens to the element that actually scrolls (e.g. `.article-col` on post pages), not just `window`, so the top accent bar fills as you read.

## 2026-06-28 — Per-page theme overrides wired up

- **`lib/theme.ts`**: Central theme storage, route matching, and boot script for site theme + per-page overrides (localStorage). Defaults: Projects → Midnight/#7c8cff; post pages → per-topic accent.
- **`ThemeRoute` + boot script**: Applies the correct theme/accent on load and client navigation; admin routes stay on the editor's site theme.
- **`PostTopicAccent`**: Sets `[data-topic]` on post pages when the posts override uses per-topic mode.
- **Theme settings UI**: Customize/reset/save now persist page overrides; customize captures the current preset + accent (posts → per-topic).

## 2026-06-28 — Site-wide responsive layout

- **Auto-fit grids**: Card grids (`feat-grid`, `service-grid`, `decision-grid`, etc.) use `repeat(auto-fit, minmax(...))` so columns shrink naturally with viewport width — removed fixed 3/2/1 breakpoint overrides that fought auto-fit.
- **Mobile pass (≤760px)**: Nav/footer subscribe stack; page headers and admin table scroll; panel pages (writing, post, projects, now, uses) collapse side rails; uses rows, home project rows, and prev/next nav stack vertically; tighter gutters via CSS vars.
- **Portfolio pages**: Shared `portfolio-hero`, `portfolio-title`, `portfolio-meta` classes; admin post table wrapped in `.table-scroll`.

## 2026-06-28 — Four-column card grids on full-width layout

- **Home + portfolio grids**: Desktop card grids (`feat-grid`, `service-grid`, `decision-grid`, `concept-grid`, `coverage-grid`, `stack-grid`, `card-grid`) use 4 columns instead of 3/auto-fill so cards don’t stretch on wide viewports; responsive fallbacks at 1200px (3), 1024px (2), 760px (1).
- **Home featured grid**: `auto-fit` columns (up to 4 on wide screens, 3 when only three are featured); no backfill from non-featured posts.

## 2026-06-28 — Layout matches mockup (edge-to-edge panels)

- **Panel pages**: Removed `--shell-inset` wrapper — `/blog`, `/projects`, `/about`, `/now`, `/uses` fill the viewport edge-to-edge with fixed sidebar rails (`200px` writing, `180px` post/projects/now/uses) per `ui-ux-mockup.html`.
- **Nav / home / footer**: Dropped centered `1280px` cap; nav uses mockup `22px` horizontal padding, home/footer use `28px` gutters.
- **Projects filter**: Reverted to mockup flat sidebar (`padding: 16px 12px`, header divider) instead of pinned scroll wrapper.

## 2026-06-28 — Sidebar UI mockup parity

- **Writing filter**: Topic dots use `t-*` CSS classes; “all” active only when no topic/tag filter; `.fc-title` alias matches mockup header class.
- **Projects filter**: “all” clears stack and status filters.

## 2026-06-28 — Post article column uses full panel width

- **`post-shell`**: Two-column grid (`180px 1fr`) matching the mockup — article body fills the panel instead of capping at `--read-w` with a dead third column. `--read-w` still applies to solo/no-TOC layouts.

## 2026-06-28 — Shell gutter regression fix

- **`.page` padding**: Switched to `padding-block` only so the vertical rhythm rule no longer zeroes out `.shell` horizontal gutters (home/admin/portfolio/404 were flush to the shell edge).
- **`.shell` width**: Added `width: 100%` so flex layout doesn’t shrink `main` to narrow portfolio content width.
- **Admin / 404**: Removed extra horizontal padding on `.admin-page` and `.e404-shell`.
- **NotiQ portfolio**: Dropped inline `maxWidth: 1000px` wrapper so case study uses full shell width like `genuine-dev`.

## 2026-06-28 — Hybrid panel margins + edit FAB fix

- **Layout**: Panel routes use `.panel-fullbleed` — full viewport height with `--shell-inset` horizontal padding so sidebars align with home/nav content; admin editor stays true edge-to-edge.
- **Edit FAB**: Moved outside `post-shell` grid (was clipped as an extra grid cell); SVG pencil icon replaces `✎` for reliable rendering; FAB `right` tracks shell inset.

## 2026-06-28 — Blog panel fills viewport

- **Layout (`globals.scss`)**: `body` flex column + `editor-fullbleed` flex stretch so `/blog` (and other panel pages) fill the viewport below the nav; grid shells use `grid-template-rows: minmax(0, 1fr)`; mobile keeps `min-height: calc(100dvh - var(--nav-h))` so short lists don't leave a gap.

## 2026-06-28 — About layout, editor parity, projects portfolio, responsive gutters

- **About (`AboutShell.tsx`)**: Two-column mockup layout — avatar, /now · /uses links, skills chips, timeline block, bio prose. Replaces bare `DocArticle` solo layout.
- **Editor**: Multi-tab bar (sessionStorage) with close buttons; file-tree **M** (modified) and **N** (new) badges; toolbar matches mockup (`::aside`, `::callout`, split + **Save draft** in toolbar-right); status bar adds split toggle + Save draft + Publish.
- **Projects**: Whole card links to case study; `projectCaseStudyHref()` routes NotiQ → `/projects/notiq`, genuine.dev → `/projects/genuine-dev`. New rich portfolio page at `/projects/genuine-dev` (architecture diagram, service cards, build phases, design signals). Seed slug `genuine-folio` → `genuine-dev`.
- **Responsive**: Mobile gutters 20px on `.shell`, `.nav-inner`, footer; about grid stacks; hero uncapped on small screens.
- **⌘K badge**: Larger padding/font (11px).

## 2026-06-28 — Reading progress bar on articles

- **`ReadingProgress` (`components/ReadingProgress.tsx`)**: Fixed 3px bar at the top of the viewport; fills left→right with `--acc` as the reader scrolls through the article body. Wired into `DocArticle` for blog posts and project/about long-form pages.

## 2026-06-28 — Layout system reset, UX fixes, undo/redo

- **Width tokens (`globals.scss`)**: `--shell-w` back to **1280px** (practical center for a blog; change one line to widen the whole site), `--gutter: 28px` (consistent, not clever), `--read-w: 720px`. Simpler to reason about than the previous `1700px + clamp()` combo.
- **Nav (`components/Nav.tsx`)**: "Writing" active pill is now only set on `/blog/*`, never on `/` (home). Removed ThemePicker from nav entirely — it lives in the admin theme settings page only. The `⌘K` badge is now a `<button>` that dispatches `open-cmdk`; also updated `.kbd` CSS.
- **CommandPalette**: Listens for `open-cmdk` custom event so clicking the nav badge opens the palette.
- **Projects page full-bleed (`AppChrome.tsx`)**: `/projects` added to the panel-page group so its sidebar fills the full viewport height (same pattern as `/blog`).
- **Projects sidebar height (`globals.scss`)**: `.projects-shell` → `height: 100%; overflow: hidden`; `.proj-filter` → `overflow-y: auto; display: flex; flex-direction: column`; `.projects-body` → `overflow-y: auto`. Matches writing-index pattern.
- **Editor toolbar (`editor/Toolbar.tsx`, `globals.scss`)**: Added **undo** (↩) and **redo** (↪) buttons at the start of the toolbar. Removed `position: sticky` from `.tb` — it was meaningless inside an `overflow: hidden` flex column and caused stacking issues. Removed duplicate `.tb-btn` / `.tb-sep` rules.
- **Mobile (`globals.scss`)**: `.projects-shell` resets to `height: auto; overflow: visible` on mobile; `.projects-body` also resets.

## 2026-06-28 — Hybrid width: wide app frame, protected reading measure

- **Width tokens (`globals.scss`)**: `--shell-w` 1080 → **1700px**, added `--read-w: 760px` (reading measure) and `--gutter: clamp(20px, 3.5vw, 48px)` (viewport-scaled side padding). The app frame now fills the screen on typical laptop/desktop sizes; reading content is capped separately.
- **App frame fills the screen**: `.shell`, `.nav-inner`, `.footer-inner`, `.footer-news` use the wide width + `--gutter`, so chrome, list/index/grid pages (writing, projects, now, uses) and admin surfaces span the viewport with aligned edges.
- **Reading stays readable**: `.article-solo` (about / no-TOC) capped at `--read-w`; post detail `.post-shell` → `180px minmax(0, var(--read-w)) 1fr` (TOC aligns left with the nav, article body bounded to ~760px, trailing space keeps alignment); `.now-body` / `.uses-body` capped at `--read-w + 120px` so their prose doesn't run edge-to-edge.
- **Rationale**: app/tool surfaces benefit from width; long-form text does not (line length > ~75ch hurts readability). The split honours both.

## 2026-06-28 — Editor full-bleed, responsive tiers, reactive nav

- **Chrome routing (`components/AppChrome.tsx`, new + `app/layout.tsx`)**: Root layout no longer forces `.shell .page` (max-width 1080px + padding) on every route. `AppChrome` now picks chrome by path: the editor (`/admin/new`, `/admin/edit/*`) renders **full-bleed** (fills viewport, no footer), the login screen renders **full-height centered** (no footer), everything else keeps the centered shell + footer. Fixes the squished/clipped editor and the off-center login card.
- **Editor sizing (`globals.scss`)**: Added `--nav-h: 57px`; `.editor-fullbleed` = `calc(100dvh - var(--nav-h))` and `.editor-shell` fills it (`height: 100%`), so the file tree + meta sidebar now run the full height of the screen.
- **Responsive tiers (`globals.scss`)**: New `≤1024px` tablet breakpoint (hides editor file tree, keeps editor + meta sidebar; 3-col theme grid) and reworked `≤760px` mobile (editor stacks: write surface → meta sidebar, split preview goes vertical, panels scroll with the page instead of being hidden).
- **Preview (`EditorForm.tsx`)**: Split-preview pane now renders with the published `.prose` styling (was a non-existent `doc-body` class) so the preview matches the live post.
- **Reactive admin pill (`components/Nav.tsx`, `lib/auth.ts`)**: Nav re-checks the token on every route change and on `auth-change` (same tab) / `storage` (cross-tab) events; `setToken`/`clearToken` dispatch `auth-change`. The **Admin ✦** pill now appears immediately after login without a hard refresh.
- **Login redirect (`app/admin/login/page.tsx`)**: Uses `router.replace("/admin")` and holds the button in its loading state through the redirect (no flash back to "Enter →"); back button no longer returns to the login form.

## 2026-06-28 — New mockup pages + NotiQ portfolio sections

- **CSS (`globals.scss`)**: Added all CSS from `notiq_portfolio.html` (`.svc-card`, `.phase`, `.decision-grid`, `.comm-table`, `.concept-grid`, `.coverage-grid`, `.stack-grid`, `.signal-list`, `.notiq-tab`, `.notiq-panel`) and new mockup pages (`.login-shell`/`.lc-*`, `.e404-*`/`.ell-*`, `.now-*`/`.npi-*`/`.nr-*`/`.nsc-*`, `.uses-*`/`.ui-*`, upgraded `.cmdk-*`/`.ci-*` with topic dots and footer).
- **404 page (`app/not-found.tsx`)** (new): Custom 404 with accent `4·0·4` code, suggestion links (rust/project/infosec) with colored topic bars, and inline search that opens ⌘K on click.
- **`/now` (`app/now/page.tsx`)** (new): Static page — two-column TOC + body layout, status cards (current project/job hunt timeline), roadmap progress bars (NotiQ 100%, genuine-folio 70%, etc.), learning chips (bug bounty/DB internals/Hindi/guitar), reading list with spine-color bars.
- **`/uses` (`app/uses/page.tsx`)** (new): Static page — two-column TOC + body layout, sections (Languages/Editor/Terminal/Stack/Hardware/Security) with colored h2 bars and item rows (name/desc/frequency tag).
- **Login (`app/admin/login/page.tsx`)**: Redesigned with centered `lc-*` card — logo, "Admin access" header, passphrase-only input with show/hide toggle, session hint with green dot, attempts counter (0/5), back-to-site link. Maps passphrase → `login("admin", passphrase)`.
- **CommandPalette (`components/CommandPalette.tsx`)**: Upgraded to new design — grouped results (posts/projects/actions), topic dot color per item, `ci-icon` + `ci-body`/`ci-sub` layout, keyboard hint footer (`↑↓`/`↵`/`esc`), result count. Projects fetched once at mount for instant filtering. Static actions include toggle theme, go to /now, go to /uses.
- **NotiQ portfolio (`app/projects/notiq/page.tsx`)** (new): Full static portfolio page at `/projects/notiq` (takes precedence over `[slug]` route). Includes: header with meta pills, architecture SVG diagram, 8 service cards, comm-matrix table, 5 expandable phase accordions, 6 engineering depth tabs (micro/dist/sysdes/rust/perf/dsa), AWS infra grid, ERD SVG diagram, tech stack grid (27 crates), design decisions signal list.
- **Nav (`Nav.tsx`)**: `/now` and `/uses` paths now mark the "About" pill as active.

## 2026-06-28 — Out-of-scope items: editor shell, theme settings, prev/next nav

- **Backend (`content.rs`, `repo.rs`)**: Added `get_adjacent_posts()` to fetch prev/next published post by date. `PostDetail` response now includes `prev: {slug, title}` and `next: {slug, title}` for navigation between posts.
- **Frontend (`lib/api.ts`)**: Added `PostNavItem` type; `PostDetail` extended with `prev`/`next`.
- **Post detail (`DocArticle.tsx`)**: Prev/next nav at bottom of article now uses real adjacent posts from API (falls back to "Back to writing" when no prev, omits next link when at end of list).
- **Admin editor (`EditorForm.tsx`)**: Full 3-panel shell layout per mockup — left file tree (220px, fetches admin list, grouped by kind, filter input, current file highlighted), center editor (tab bar with unsaved indicator, title input, TipTap WYSIWYG, status bar with word count/read time/save button), right tabbed sidebar (Meta: all form fields including slug/summary/kind/status/topic picker/tags/series/cover; Outline: heading hierarchy from markdown; Diagnostics: live checks for missing fields, word count, topic accent info).
- **Theme settings (`app/admin/settings/theme/page.tsx`)** (new): Interactive `/admin/settings/theme` page — admin left nav (content/site sections), 5 preset theme cards with miniature previews (Dark/Light/Midnight/Sepia/Matrix), 8 accent colour swatches + custom colour picker, live preview panel that re-renders on every selection, per-page override table, save bar that persists to localStorage and applies via `__setTheme`/`__setAccent`. Link added to admin dashboard.
- **SCSS (`globals.scss`)**: Added all editor-shell, file-tree, tab-bar, toolbar, sidebar, outline, diagnostics, publish-modal, and theme-settings CSS classes. Also added `art-prevnext`/`art-pn` styles for the post prev/next nav.

## 2026-06-28 — Full UI/UX parity with `docs/mockups/ui-ux-mockup.html`

- **SCSS (`globals.scss`)**: Ported all CSS classes from the mockup — topic-bar colours (`.t-rust`, `.t-infosec`, etc.), home feat-card grid, home-proj-row, writing-index two-column shell, post-shell/toc-col/art-* for post detail, projects-shell/project-card, admin stat cards/status-badge/post-table. Also added missing theme bg variables (`--purple-bg`, `--warn-bg`, `--green-bg`, `--warn-border`, etc.) to `@mixin theme-vars`.
- **`lib/topic.ts`** (new): `deriveTopic()` + `topicColor()` + `topicCssClass()` helpers — maps topic strings to the per-topic accent colours used by colored bars and tags.
- **Nav (`Nav.tsx`)**: Logo changed to `genuine.dev` (`.` accent); added `⌘K` kbd hint; admin pill (`.npill.admin`) shown when a JWT token exists.
- **Home (`app/page.tsx`)**: Featured writing uses `feat-card` grid with colored top bar, topic tag, summary, date/min meta. Selected projects use `home-proj-row` with colored left bar, name, description, tech chips, "case study →" link.
- **Writing index** (`app/blog/page.tsx` → new `WritingIndex.tsx`): Full two-column `wri-shell` layout — sticky filter sidebar (topic + tag filters with colored dots + counts, newest/oldest sort) | post list with year dividers, 3px topic-colored left bar per row, summary, read time, "new" badge for posts < 14 days old.
- **Projects** (`app/projects/page.tsx` → new `ProjectsShell.tsx`): Two-column `projects-shell` — filter sidebar (stack + status filters) | `project-card` rows with colored left bar, complete/wip badge, description, chip stack, links.
- **Post detail (`DocArticle.tsx`)**: Switched to `post-shell` (180px TOC col + article col). TOC column now shows heading links + divider + date/read/topic/tags key-value pairs. Article column renders `art-eyebrow`, `art-h1`, `art-meta` with `art-topic-pill` (topic colour). `DocInteractive` scroll-spy updated to target `.toc-link`.
- **Admin post list (`admin/page.tsx`)**: Stat cards row (total/published/drafts/projects counts), filter chip row (all/posts/projects/drafts/published), rich `post-table` with title+tags, `status-badge`, and ra edit/delete actions.
- **Metadata**: Layout title updated to `genuine.dev`.

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
