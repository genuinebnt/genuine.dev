"use client";

import { useState } from "react";
import { usePhaseAccordion } from "../../../hooks/usePhaseAccordion";
import {
  PortfolioHero,
  PortfolioPageShell,
  PortfolioRainbow,
  PortfolioSection,
} from "../../../components/portfolio/PortfolioLayout";
import {
  PortfolioCommTable,
  PortfolioConceptGrid,
  PortfolioConceptTabs,
  PortfolioCoverageGrid,
  PortfolioFooterLinks,
  PortfolioPhases,
  PortfolioServiceGrid,
  PortfolioSignals,
  PortfolioStackGrid,
} from "../../../components/portfolio/PortfolioBlocks";

function ArchSvg() {
  return (
    <svg width="100%" viewBox="0 0 880 320" role="img" style={{ display: "block" }}>
      <title>genuine.dev architecture</title>
      <defs>
        <marker id="folio-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#3a4050" strokeWidth="1.5" />
        </marker>
      </defs>
      <rect x="340" y="20" width="200" height="40" rx="6" fill="#1a1e25" stroke="#2e3540" />
      <text x="440" y="44" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="12" fill="#60a5fa">Browser</text>
      <line x1="440" y1="60" x2="440" y2="88" stroke="#3a4050" markerEnd="url(#folio-arr)" />
      <rect x="20" y="96" width="400" height="72" rx="8" fill="rgba(96,165,250,0.07)" stroke="rgba(96,165,250,0.3)" />
      <text x="220" y="122" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="13" fontWeight="500" fill="#60a5fa">Next.js frontend</text>
      <text x="220" y="144" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">SSR · admin editor · TipTap → markdown</text>
      <line x1="420" y1="132" x2="448" y2="132" stroke="#3a4050" markerEnd="url(#folio-arr)" />
      <text x="430" y="124" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">JSON</text>
      <rect x="460" y="96" width="400" height="72" rx="8" fill="rgba(0,212,164,0.07)" stroke="rgba(0,212,164,0.28)" />
      <text x="660" y="122" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="13" fontWeight="500" fill="#00d4a4">Rust API (axum)</text>
      <text x="660" y="144" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">hexagonal · ports &amp; adapters · JWT admin</text>
      <line x1="660" y1="168" x2="660" y2="196" stroke="#3a4050" markerEnd="url(#folio-arr)" />
      <rect x="520" y="204" width="280" height="56" rx="8" fill="#13161b" stroke="#232830" />
      <text x="660" y="228" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="12" fill="#e2e6ee">Postgres</text>
      <text x="660" y="246" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">documents · comments · subscribers</text>
      <rect x="20" y="204" width="420" height="56" rx="8" fill="rgba(167,139,250,0.07)" stroke="rgba(167,139,250,0.25)" />
      <text x="230" y="228" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="12" fontWeight="500" fill="#a78bfa">Renderer pipeline</text>
      <text x="230" y="246" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">comrak · syntect · ::: directives</text>
      <line x1="440" y1="168" x2="230" y2="204" stroke="#3a4050" strokeDasharray="4 3" />
    </svg>
  );
}

function SchemaSvg() {
  return (
    <div className="schema-wrap">
      <svg width="100%" viewBox="0 0 920 420" style={{ display: "block", minWidth: "640px" }}>
        <title>genuine.dev content schema</title>
        {[
          { x: 20, title: "documents", color: "#00d4a4", fields: [["id", "uuid PK"], ["slug", "text UNIQUE"], ["kind", "post|project|page"], ["title", "text"], ["body_md", "text"], ["body_html", "text"], ["metadata", "jsonb"], ["published_at", "timestamptz?"]] },
          { x: 240, title: "comments", color: "#60a5fa", fields: [["id", "uuid PK"], ["document_id", "uuid FK"], ["author", "text"], ["body", "text"], ["created_at", "timestamptz"]] },
          { x: 460, title: "subscribers", color: "#a78bfa", fields: [["id", "uuid PK"], ["email", "text UNIQUE"], ["token", "text"], ["confirmed_at", "timestamptz?"], ["created_at", "timestamptz"]] },
          { x: 680, title: "media", color: "#f59e0b", fields: [["id", "uuid PK"], ["path", "text"], ["mime", "text"], ["size_bytes", "bigint"], ["uploaded_at", "timestamptz"]] },
        ].map((t) => (
          <g key={t.title}>
            <rect x={t.x} y="20" width="200" height={38 + t.fields.length * 22} rx="6" fill="#1a1e25" stroke={`${t.color}55`} strokeWidth="1.5" />
            <rect x={t.x} y="20" width="200" height="28" rx="6" fill={`${t.color}18`} stroke={`${t.color}55`} strokeWidth="1.5" />
            <text x={t.x + 100} y="38" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="11" fontWeight="500" fill={t.color}>{t.title}</text>
            <line x1={t.x} y1="48" x2={t.x + 200} y2="48" stroke={`${t.color}33`} strokeWidth="0.5" />
            {t.fields.map(([k, v], i) => (
              <g key={k}>
                <text x={t.x + 14} y={66 + i * 22} fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#6b7280">{k}</text>
                <text x={t.x + 186} y={66 + i * 22} textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#3a4050">{v}</text>
              </g>
            ))}
          </g>
        ))}
        <line x1="220" y1="120" x2="240" y2="120" stroke="#3a4050" strokeWidth="1" markerEnd="url(#folio-arr)" />
        <text x="230" y="112" fontFamily="IBM Plex Mono,monospace" fontSize="8" fill="#3a4050">FK</text>
      </svg>
    </div>
  );
}

const SERVICES = [
  { cls: "gateway", name: "web (axum)", owns: "owns: HTTP, auth extractors, routing", tags: ["axum", "tower", "JWT"], desc: "Thin inbound adapter. Maps requests to application use cases, enforces admin JWT on mutating routes, and returns JSON or rendered HTML fragments for the editor preview." },
  { cls: "queue", name: "domain", owns: "owns: entities, invariants, value objects", tags: ["pure Rust", "newtypes", "parse don't validate"], desc: "Slug, DocumentId, PublishState — validated on construction. No sqlx, no axum, no IO. Business rules like publish/draft transitions live here." },
  { cls: "worker", name: "application", owns: "owns: use cases, port traits", tags: ["hexagonal", "ports", "DI"], desc: "PublishPost, RenderDocument, ListPublished — orchestrate domain + ports. Traits defined at known seams: ContentRepository, Renderer, AuthProvider, ThemeProvider." },
  { cls: "delivery", name: "infra", owns: "owns: Postgres, render, storage adapters", tags: ["sqlx", "comrak", "syntect"], desc: "PgContentRepository, ComrakRenderer, LocalDiskStorage. Runtime-checked sqlx queries; integration tests with testcontainers, not compile-time query! macros." },
  { cls: "scheduler", name: "frontend (Next.js)", owns: "owns: SSR, panel layouts, public chrome", tags: ["React", "App Router", "SCSS"], desc: "Server-rendered reading experience with mockup-aligned panel shells — writing index, post detail, projects, about/now/uses. Fetches JSON from the Rust API." },
  { cls: "admin-s", name: "admin editor", owns: "owns: TipTap CMS, preview, publish flow", tags: ["TipTap", "directives", "JWT"], desc: "Three-panel editor shell: file tree | TipTap write surface + preview | meta/outline/diagnostics. Serializes ::: directives as raw markdown source, never HTML drift." },
  { cls: "gateway", name: "directive renderer", owns: "owns: rich blocks, code highlight", tags: ["comrak", "syntect", "directives"], desc: "Three-pass pipeline: attributed code fences with syntect, ::: directive blocks (service cards, comm matrix, phases, tabs), then standard markdown. Powers both posts and portfolio pages." },
  { cls: "worker", name: "newsletter + search", owns: "owns: subscribers, FTS, feeds", tags: ["lettre", "FTS", "RSS"], desc: "Double-opt-in subscribers, Postgres FTS for Cmd-K search, RSS/sitemap generation. Email provider abstracted behind a port — MVP uses lettre." },
];

const COMM = [
  ["Browser → Next.js", "HTTPS", "ssr", "SSR/CSR hybrid", "static assets cached; API errors mapped to error boundaries"],
  ["Next.js → Rust API", "HTTPS / JSON", "rest", "server-side fetch + admin JWT", "401 on expired token → admin re-login"],
  ["Rust API → Postgres", "TCP / sqlx", "", "connection pool, migrations", "pool reconnect on failover; typed repo errors"],
  ["Rust API → Renderer", "in-process", "", "sync call per document", "malformed directive → typed RenderError, never panic"],
  ["Rust API → local disk", "filesystem", "", "media uploads, static fallbacks", "missing file → 404 at web edge only"],
  ["Admin editor → API", "HTTPS / JSON", "rest", "JWT on mutating routes", "slug conflict → 409 with structured error"],
  ["Public pages → API", "HTTPS / JSON", "rest", "read-only, cache-friendly", "unpublished slugs → 404, no leak"],
];

const PHASES = [
  {
    num: "01", cls: "", title: "Hexagonal boundaries", sub: "domain · app · infra · web",
    decisions: [
      { t: "Dependencies point inward", p: "Domain has no framework types. Application defines port traits. Infrastructure implements them. Web handlers are mappers — no business logic at the HTTP edge." },
      { t: "Rule of three for abstractions", p: "Ports exist only at seams with a planned second implementation: ContentRepository, Renderer, StorageBackend, AuthProvider, ThemeProvider. No premature generalization elsewhere." },
      { t: "Single binary modular monolith", p: "Not microservices — that's NotiQ's job. Module boundaries mirror future workspace crates (domain, app, infra, web) without the operational cost of eight deployables." },
      { t: "Typed errors per layer", p: "thiserror enums in domain/app/infra; propagate with ?; map to HTTP only via IntoResponse at the web edge. No anyhow outside main." },
    ],
  },
  {
    num: "02", cls: "blue", title: "Markdown as canonical format", sub: "TipTap round-trip · no HTML drift",
    decisions: [
      { t: "Posts stored as markdown", p: "body_md is the source of truth in Postgres. body_html is a rendered cache invalidated on publish. The browser never writes HTML directly into the database." },
      { t: "Directives as raw source", p: "Structured blocks (service cards, comm matrix, build accordion) serialize back to ::: fenced source. The editor preview and production HTML use the same renderer pass." },
      { t: "Slug as value object", p: "Slug parsed on construction — lowercase, hyphenated, no uppercase. Uniqueness checked at publish time via the repository port, not in the handler." },
      { t: "Metadata in jsonb", p: "topic, tags, featured, series live in documents.metadata — schema-flexible without migrations for every new editorial field." },
    ],
  },
  {
    num: "03", cls: "purple", title: "Directive block registry", sub: "asides · callouts · portfolio blocks",
    decisions: [
      { t: "Three-pass render pipeline", p: "Pass 1: syntect code fences with filename/highlight attributes. Pass 2: ::: directive blocks via a registry map. Pass 3: comrak for standard markdown. Order matters — directives before comrak." },
      { t: "Same blocks as NotiQ portfolio", p: "Service cards, comm matrix, phase accordion, concept tabs, and signal list are directives — this case study page and NotiQ share one renderer, proving the registry design." },
      { t: "Client hydration for interactivity", p: "Tabs, accordions, and Cmd-K attach via DocInteractive after SSR. Server HTML is complete without JS; hydration enhances, never required for reading." },
      { t: "Preview parity", p: "Admin editor preview calls the same RenderDocument use case as production. What you preview is what ships — no separate client-side markdown parser." },
    ],
  },
  {
    num: "04", cls: "green", title: "Auth + browser-only CMS", sub: "JWT admin · Postgres SoT · no git ingest",
    decisions: [
      { t: "JWT for admin, public reads open", p: "Mutating API routes require a valid admin JWT. Public document reads are unauthenticated. Postgres is the single source of truth — no file/git content ingest." },
      { t: "Argon2 passphrase hash", p: "Single admin account for MVP. Passphrase hashed with argon2 at startup wiring; verified via AuthProvider port. Rate-limited login with attempt counter." },
      { t: "Publish workflow", p: "Draft → scheduled → published states enforced in domain. published_at set atomically on publish. Slug immutability after first publish prevents broken links." },
      { t: "Editor as the only authoring surface", p: "No CLI ingest, no git sync. The MVP goal is: owner writes posts in the browser and they appear on the live site. Everything else is post-MVP." },
    ],
  },
  {
    num: "05", cls: "warn", title: "Theming, search, and deploy", sub: "CSS variables · FTS · VPS · Docker",
    decisions: [
      { t: "CSS-variable theming", p: "Five preset themes + per-topic accents via [data-theme] and [data-topic]. Theme settings in admin persist to localStorage with per-page overrides — no flash on load via inline boot script." },
      { t: "Postgres FTS for Cmd-K", p: "documents.search_vector updated on publish. Command palette queries weighted tsvector — title A, tags B, body C. Sub-100ms on seed corpus; port ready for Meilisearch later." },
      { t: "Docker Compose for MVP deploy", p: "Postgres + Rust API + Next.js frontend on a VPS. Migrations via refinery/sqlx at startup. Static media on local disk — S3 adapter planned behind StorageBackend port." },
      { t: "Integration tests over compile-time SQL", p: "sqlx runtime queries + testcontainers for repo correctness. Avoids query! coupling builds to a live DB (ADR-011) while still catching broken SQL in CI." },
    ],
  },
];

type TabId = "arch" | "render" | "content" | "frontend" | "ops";
const TABS: { id: TabId; label: string }[] = [
  { id: "arch", label: "Architecture" },
  { id: "render", label: "Rendering" },
  { id: "content", label: "Content model" },
  { id: "frontend", label: "Frontend" },
  { id: "ops", label: "Ops & deploy" },
];

const CONCEPTS: Record<TabId, { domain: string; name: string; desc: string }[]> = {
  arch: [
    { domain: "sysdes", name: "Hexagonal / ports & adapters", desc: "Inbound web adapter (axum) and outbound infra adapters (sqlx, comrak, disk) both depend on application port traits — never on each other." },
    { domain: "micro", name: "Modular monolith", desc: "Single deployable binary with strict module boundaries. Promotes to a Cargo workspace once crate graph stabilizes — domain must never import infra." },
    { domain: "dist", name: "AppState dependency injection", desc: "Arc<dyn ContentRepository> wired at startup. Handlers receive ports via axum State — no globals, no service locator, testable with trait fakes." },
    { domain: "sysdes", name: "Thin server functions", desc: "Next.js pages fetch from Rust API — no business logic in React components. Admin mutations go through typed lib/api.ts helpers with JWT headers." },
    { domain: "rust", name: "Runtime-checked sqlx", desc: "query/query_as with FromRow — not query! macros. Correctness from testcontainers integration tests, not compile-time DB coupling." },
    { domain: "rust", name: "CancellationToken shutdown", desc: "Graceful shutdown on SIGTERM: stop accepting, drain in-flight requests, close pool. Matches the pattern used in NotiQ worker-svc." },
  ],
  render: [
    { domain: "rust", name: "comrak + custom extensions", desc: "Standard markdown via comrak with a pre-processing pass for ::: directives and attributed code fences before HTML emission." },
    { domain: "perf", name: "syntect highlighting", desc: "Code fences carry language, optional filename, and highlight line ranges. Theme matches site dark palette; output cached in body_html on publish." },
    { domain: "micro", name: "Directive registry", desc: "Each directive type maps to a parser + HTML emitter. Adding a block means one registry entry — not a fork of the markdown parser." },
    { domain: "sysdes", name: "Lossless round-trip", desc: "Editor stores directive source verbatim. WYSIWYG forms edit structured fields but serialize back to ::: source — the data contract never becomes HTML." },
    { domain: "rust", name: "RenderDocument use case", desc: "Orchestrates Renderer port + optional cache read. Same entry point for publish, preview, and RSS body extraction." },
    { domain: "perf", name: "body_html cache", desc: "Rendered HTML stored on publish. Public reads skip the render pipeline entirely — only preview and re-publish trigger comrak+syntect." },
  ],
  content: [
    { domain: "sysdes", name: "Document kinds", desc: "posts, projects, pages — one documents table with kind discriminator. Projects power case studies; pages power about/now/uses static content." },
    { domain: "dist", name: "Slug uniqueness", desc: "Enforced at publish via repository query. Prev/next navigation computed in ListPublished ordering — adjacent posts returned in PostDetail API response." },
    { domain: "micro", name: "Featured + topic metadata", desc: "featured flag drives home grid. topic + tags drive per-topic accent colors and writing index filters — all in jsonb metadata, no join tables for MVP." },
    { domain: "sysdes", name: "Series support", desc: "series name + part number in metadata. SeriesBanner component renders on post detail when present — editorial grouping without a separate series table." },
    { domain: "dist", name: "Comments (public)", desc: "comments table keyed to document_id. Moderation is post-MVP; MVP stores author + body with created_at. Rendered below article prose." },
    { domain: "sysdes", name: "Newsletter subscribers", desc: "Double-opt-in flow: subscribe → confirmation email → confirmed_at set. Port abstracts email provider; lettre for MVP." },
  ],
  frontend: [
    { domain: "micro", name: "Panel shell layouts", desc: "Writing, post, projects, about/now/uses use full-viewport two-column shells — sidebar rail + scrollable body — matching ui-ux-mockup.html." },
    { domain: "sysdes", name: "AppChrome route switching", desc: "Panel pages fill viewport without footer. Home, portfolio case studies, admin, and 404 use padded shell + footer. Editor is true edge-to-edge." },
    { domain: "rust", name: "TipTap directive nodes", desc: "Custom TipTap extensions for each directive type. Toolbar inserts ::: templates; sidebar forms edit structured fields on selected blocks." },
    { domain: "perf", name: "CSS-variable theming", desc: "Five presets in SCSS maps. Per-page overrides + per-topic accents via data attributes. No runtime CSS-in-JS — zero hydration cost for theme." },
    { domain: "micro", name: "Cmd-K palette", desc: "Grouped search across posts, projects, and actions. Topic dot colors per result. Keyboard nav with ↑↓/↵/esc — opens via nav badge or keyboard shortcut." },
    { domain: "sysdes", name: "Reading progress bar", desc: "Fixed accent bar tracks scroll within panel scroll containers (not window) — GPU transform with rAF smoothing." },
  ],
  ops: [
    { domain: "cloud", name: "VPS + Docker Compose", desc: "MVP target: single VPS with compose stack — Postgres, Rust API, Next.js. NotiQ showcases multi-service ECS; this site showcases operational simplicity." },
    { domain: "cloud", name: "sqlx migrations", desc: "Versioned migrations in /migrations. Applied at startup via refinery or sqlx migrate. Schema changes require a migration — no manual console edits." },
    { domain: "cloud", name: "figment config", desc: "Typed Config: defaults → file → env. DATABASE_URL, JWT_SECRET, media path — all validated on boot. Fail fast on misconfiguration." },
    { domain: "dist", name: "tracing + structured logs", desc: "tracing spans per request and use case. JSON logs in production; pretty logs in dev. Error mapping at web edge preserves internal detail in logs only." },
    { domain: "sysdes", name: "Health checks", desc: "/health returns 200 when pool connects. Compose depends_on with health condition — API waits for Postgres before accepting traffic." },
    { domain: "rust", name: "CI: fmt, clippy, test", desc: "cargo fmt, cargo clippy -- -D warnings, cargo test with testcontainers for repos. Frontend: tsc --noEmit. No deploy without green CI." },
  ],
};

const COVERAGE = [
  { svc: "Postgres", impl: "Single source of truth for all content, comments, subscribers. FTS index on documents. Migrations versioned." },
  { svc: "Local disk storage", impl: "Media uploads and static fallbacks behind StorageBackend port. S3 adapter planned — port seam already defined." },
  { svc: "Docker Compose", impl: "Postgres + API + frontend on one VPS. env file for secrets. Health-checked startup order." },
  { svc: "JWT admin auth", impl: "Argon2 passphrase hash. Short-lived tokens. Admin-only mutating routes. Public reads unauthenticated." },
  { svc: "RSS + sitemap", impl: "Generated from published documents. /feed.xml and /sitemap.xml at web edge — no build-step file generation." },
  { svc: "Newsletter (lettre)", impl: "Double-opt-in subscribers. EmailProvider port with lettre impl now; SES/SendGrid swap later." },
  { svc: "Theme system", impl: "SCSS token maps, inline boot script, admin theme settings, per-page overrides, per-topic post accents." },
  { svc: "Search / Cmd-K", impl: "Postgres FTS for MVP. SearchBackend port defined — Meilisearch as planned second impl." },
  { svc: "GitHub Actions CI", impl: "fmt + clippy + test on every push. testcontainers for repo integration tests — no live DB required for compile." },
  { svc: "TipTap editor", impl: "WYSIWYG admin with directive blocks, split preview, file tree, publish modal. Serializes to markdown." },
];

const STACK = [
  { crate: "axum + tower", role: "HTTP API, middleware chain, JWT extractors" },
  { crate: "sqlx + tokio", role: "Postgres pool, async repos, runtime queries" },
  { crate: "comrak + syntect", role: "markdown + code highlighting pipeline" },
  { crate: "figment", role: "typed config: defaults → file → env" },
  { crate: "argon2 + jsonwebtoken", role: "admin auth — hash + JWT issue/verify" },
  { crate: "thiserror + tracing", role: "typed errors per layer, structured spans" },
  { crate: "testcontainers", role: "Postgres in integration tests for repos" },
  { crate: "lettre", role: "newsletter email — MVP provider" },
  { crate: "Next.js 15", role: "App Router SSR, admin pages, API client" },
  { crate: "React + TipTap", role: "WYSIWYG editor, directive node extensions" },
  { crate: "SCSS modules", role: "NotiQ design tokens, panel layouts, themes" },
  { crate: "TypeScript", role: "typed API client, admin forms, Cmd-K palette" },
];

const SIGNALS = [
  { tag: "architecture", cls: "micro", text: "Hexagonal monolith over microservices for a CMS: the complexity budget goes into the renderer and editor, not service mesh overhead. NotiQ is the distributed systems showcase; this site documents it." },
  { tag: "architecture", cls: "micro", text: "Ports at real seams only — ContentRepository has a Pg impl today and a fake for unit tests. No StorageBackend second impl yet, so no trait until S3 is real." },
  { tag: "rendering", cls: "rust", text: "Directive source stored losslessly as markdown. The editor can show structured forms because the renderer parses the same ::: source the database holds — not a parallel JSON schema." },
  { tag: "rendering", cls: "rust", text: "body_html as a publish-time cache means public reads never invoke comrak. Preview and re-publish pay the render cost; readers don't." },
  { tag: "content", cls: "db", text: "jsonb metadata avoids schema migrations for editorial fields like featured, topic, and series. Structured enough for filters; flexible enough for iteration." },
  { tag: "content", cls: "db", text: "Slug as a validated value object at the domain edge — handlers never pass bare String where Slug is meant. Invalid slugs fail at parse time, not at INSERT." },
  { tag: "frontend", cls: "dist", text: "Panel pages scroll inside .article-col / .post-col — not the window. Reading progress, TOC, and side rails depend on getting this scroll container right." },
  { tag: "frontend", cls: "dist", text: "TipTap round-trip is the riskiest integration in the stack. Tests pin directive serialization — if the editor emits HTML instead of ::: source, the renderer contract breaks silently." },
  { tag: "auth", cls: "cloud", text: "Single admin account is an MVP constraint, not a design goal. AuthProvider port accepts a second impl when multi-user admin arrives in Phase 5." },
  { tag: "ops", cls: "cloud", text: "Runtime sqlx queries over query! — ADR-011. Integration tests on testcontainers catch SQL drift; compile-time checking couples every build to a live database." },
  { tag: "ops", cls: "cloud", text: "Docker Compose on a VPS ships the MVP. The deploy story is intentionally boring — one host, three containers, health checks — so the owner can focus on writing." },
  { tag: "theming", cls: "dist", text: "Per-topic accents via [data-topic] on post pages layer on top of site theme + per-page overrides. Precedence: base theme → site accent → page override → topic accent." },
];

export default function GenuineDevProject() {
  const { openPhases, togglePhase } = usePhaseAccordion([0]);
  const [activeTab, setActiveTab] = useState<TabId>("arch");

  return (
    <PortfolioPageShell>
      <PortfolioHero
        eyebrow="Rust · Next.js · Postgres · CMS"
        title={
          <>
            genuine<span style={{ color: "var(--acc)" }}>.</span>dev
          </>
        }
        lead="This portfolio and technical blog — a DB-backed CMS with a hexagonal Rust API, Next.js front end, and a custom markdown renderer that powers the rich blocks on these case-study pages, including NotiQ."
        pills={[
          { label: "Stack", value: "Rust · Next.js · Postgres" },
          { label: "Pattern", value: "hexagonal monolith" },
          { label: "Editor", value: "browser-only CMS" },
        ]}
      />

      <PortfolioRainbow />

      <PortfolioSection label="system architecture">
        <ArchSvg />
      </PortfolioSection>

      <PortfolioSection label="layers — bounded contexts">
        <PortfolioServiceGrid services={SERVICES} />
      </PortfolioSection>

      <PortfolioSection label="request flow">
        <PortfolioCommTable rows={COMM} />
      </PortfolioSection>

      <PortfolioSection label="how it was built — key decisions">
        <PortfolioPhases phases={PHASES} openPhases={openPhases} onToggle={togglePhase} />
      </PortfolioSection>

      <PortfolioSection label="engineering depth">
        <PortfolioConceptTabs tabs={TABS} activeTab={activeTab} onSelect={setActiveTab}>
          <PortfolioConceptGrid concepts={CONCEPTS[activeTab]} />
        </PortfolioConceptTabs>
      </PortfolioSection>

      <PortfolioSection label="platform coverage">
        <PortfolioCoverageGrid items={COVERAGE} />
      </PortfolioSection>

      <PortfolioSection label="data model">
        <SchemaSvg />
      </PortfolioSection>

      <PortfolioSection label="tech stack">
        <PortfolioStackGrid items={STACK} />
      </PortfolioSection>

      <PortfolioSection label="decisions worth discussing">
        <PortfolioSignals items={SIGNALS} />
      </PortfolioSection>

      <PortfolioFooterLinks
        links={[
          { href: "/projects", label: "← All projects" },
          { href: "/projects/db-labs", label: "db-labs case study →" },
        ]}
      />
    </PortfolioPageShell>
  );
}
