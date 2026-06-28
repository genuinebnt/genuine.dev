"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import {
  adminList,
  adminSave,
  uploadImage,
  type AdminItem,
  type DocMetadata,
  type EditDoc,
} from "../lib/auth";
import { RichEditor } from "./editor/RichEditor";
import { deriveTopic, topicColor } from "../lib/topic";

const TABS_KEY = "editor-open-tabs";
const TAB_NEW = "__new__";

function readTabs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(TABS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeTabs(tabs: string[]) {
  sessionStorage.setItem(TABS_KEY, JSON.stringify(tabs));
}

function tabSlug(initial: EditDoc): string {
  return initial.slug || TAB_NEW;
}

function tabLabel(slug: string, title: string, fallbackSlug: string): string {
  if (slug === TAB_NEW) return "untitled.md";
  return `${slug || fallbackSlug || "untitled"}.md`;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const blank: EditDoc = {
  slug: "",
  kind: "post",
  title: "",
  summary: null,
  status: "draft",
  body_markdown: "",
  cover_image: null,
  metadata: {},
};

const csv = (value: unknown): string => (Array.isArray(value) ? value.join(", ") : "");
const toList = (v: string): string[] => v.split(",").map((s) => s.trim()).filter(Boolean);

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseHeadings(md: string) {
  const lines = md.split("\n");
  return lines
    .map((line, i) => {
      const m = line.match(/^(#{1,3})\s+(.+)$/);
      if (!m) return null;
      return { level: m[1].length, text: m[2], lineNum: i + 1 };
    })
    .filter(Boolean) as { level: number; text: string; lineNum: number }[];
}

const TOPIC_OPTIONS = ["rust", "infosec", "distributed", "systems", "performance", "ctf"];

// ── main component ────────────────────────────────────────────────────────────

export default function EditorForm({ initial = blank }: { initial?: EditDoc }) {
  const router = useRouter();
  const md = initial.metadata ?? {};
  const initialSeries = (md.series ?? null) as { name: string; part: number } | null;

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [summary, setSummary] = useState(initial.summary ?? "");
  const [kind, setKind] = useState(initial.kind);
  const [status, setStatus] = useState(initial.status);
  const [body, setBody] = useState(initial.body_markdown);
  const [coverImage, setCoverImage] = useState<string | null>(initial.cover_image);
  const [featured, setFeatured] = useState(Boolean(md.featured));
  const [seriesName, setSeriesName] = useState(initialSeries?.name ?? "");
  const [seriesPart, setSeriesPart] = useState(String(initialSeries?.part ?? 1));
  const [tags, setTags] = useState(csv(md.tags));
  const [tech, setTech] = useState(csv(md.tech));
  const [topic, setTopic] = useState((md.topic as string | undefined) ?? "");

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sideTab, setSideTab] = useState<"meta" | "outline" | "diag">("meta");
  const [showPreview, setShowPreview] = useState(false);
  const [docs, setDocs] = useState<AdminItem[]>([]);
  const [ftFilter, setFtFilter] = useState("");

  const words = useMemo(() => wordCount(body), [body]);
  const readMin = Math.max(1, Math.round(words / 250));
  const headings = useMemo(() => parseHeadings(body), [body]);
  const previewHtml = useMemo(() => {
    const result = marked(body);
    return typeof result === "string" ? result : "";
  }, [body]);
  const isDirty =
    body !== initial.body_markdown ||
    title !== initial.title ||
    slug !== initial.slug ||
    summary !== (initial.summary ?? "") ||
    status !== initial.status;

  const currentTab = tabSlug(initial);

  const [openTabs, setOpenTabs] = useState<string[]>(() => [currentTab]);

  useEffect(() => {
    const existing = readTabs();
    const next = existing.includes(currentTab) ? existing : [...existing, currentTab];
    writeTabs(next);
    setOpenTabs(next);
  }, [currentTab]);

  function openTab(slug: string) {
    const next = openTabs.includes(slug) ? openTabs : [...openTabs, slug];
    writeTabs(next);
    setOpenTabs(next);
  }

  function closeTab(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    e.stopPropagation();
    const next = openTabs.filter((t) => t !== slug);
    writeTabs(next);
    setOpenTabs(next);
    if (slug === currentTab && next.length > 0) {
      const target = next[next.length - 1];
      router.push(target === TAB_NEW ? "/admin/new" : `/admin/edit/${target}`);
    } else if (slug === currentTab) {
      router.push("/admin");
    }
  }

  function tabHref(slug: string): string {
    return slug === TAB_NEW ? "/admin/new" : `/admin/edit/${slug}`;
  }

  function tabDisplayName(slug: string): string {
    if (slug === currentTab) return tabLabel(slug, title, slug);
    if (slug === TAB_NEW) return "untitled.md";
    const doc = docs.find((d) => d.slug === slug);
    return `${slug}.md${doc?.title ? "" : ""}`;
  }

  useEffect(() => {
    adminList().then(setDocs).catch(() => {});
  }, []);

  // group docs by kind for the file tree
  const grouped = useMemo(() => {
    const q = ftFilter.toLowerCase();
    const filtered = docs.filter(
      (d) => !q || d.title.toLowerCase().includes(q) || d.slug.includes(q),
    );
    const posts = filtered.filter((d) => d.kind === "post");
    const projects = filtered.filter((d) => d.kind === "project");
    return { posts, projects };
  }, [docs, ftFilter]);

  // diagnostics
  const diags = useMemo(() => {
    const issues: { type: "warn" | "ok" | "info"; msg: string; sub: string }[] = [];
    if (!title.trim()) issues.push({ type: "warn", msg: "title missing", sub: "Add a title to the post." });
    else issues.push({ type: "ok", msg: "title present", sub: title.trim() });
    if (!slug.trim()) issues.push({ type: "warn", msg: "slug empty", sub: "Will be auto-generated from title on save." });
    else issues.push({ type: "ok", msg: "slug set", sub: slug });
    if (!summary.trim()) issues.push({ type: "warn", msg: "summary missing", sub: "Add a summary for the post card." });
    else issues.push({ type: "ok", msg: "summary present", sub: summary.trim().slice(0, 60) + "…" });
    if (!toList(tags).length) issues.push({ type: "warn", msg: "no tags", sub: "Add tags to enable filtering." });
    else issues.push({ type: "ok", msg: `${toList(tags).length} tag(s)`, sub: tags });
    issues.push({ type: "info", msg: `${words} words · ~${readMin} min read`, sub: "Estimated at 250 wpm." });
    if (topic) issues.push({ type: "info", msg: `topic: ${topic}`, sub: `Accent colour will follow the ${topic} palette.` });
    return issues;
  }, [title, slug, summary, tags, words, readMin, topic]);

  const warnCount = diags.filter((d) => d.type === "warn").length;

  function buildMetadata(): DocMetadata {
    const next: DocMetadata = { ...md };
    next.featured = featured;
    if (topic) next.topic = topic; else delete next.topic;
    if (seriesName.trim()) next.series = { name: seriesName.trim(), part: Number(seriesPart) || 1 };
    else delete next.series;
    if (toList(tags).length) next.tags = toList(tags); else delete next.tags;
    if (kind === "project" && toList(tech).length) next.tech = toList(tech); else delete next.tech;
    return next;
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try { setCoverImage(await uploadImage(file)); }
    catch { setErr("Cover image upload failed."); }
  }

  async function persist(redirectAdmin: boolean, forceDraft = false) {
    setSaving(true);
    setErr(null);
    const saveStatus = forceDraft ? "draft" : status;
    try {
      await adminSave({
        slug,
        kind,
        title,
        summary: summary || "",
        status: saveStatus,
        body,
        cover_image: coverImage,
        metadata: buildMetadata(),
      });
      if (redirectAdmin) router.push("/admin");
      else setStatus(saveStatus);
    } catch {
      setErr("Save failed — are you logged in?");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    await persist(true);
  }

  async function handleSaveDraft() {
    await persist(false, true);
  }


  return (
    <div className="editor-shell">
      {/* ── Left: file tree ── */}
      <div className="file-tree">
        <div className="ft-header">
          <span className="ft-title">Posts</span>
          <div className="ft-actions">
            <Link href="/admin/new" className="ft-btn" title="New post">+</Link>
          </div>
        </div>
        <div className="ft-search">
          <span style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: "11px" }}>⌕</span>
          <input
            placeholder="filter…"
            value={ftFilter}
            onChange={(e) => setFtFilter(e.target.value)}
          />
        </div>
        <div className="file-list">
          {grouped.posts.length > 0 && (
            <>
              <div className="dir-row">
                <span className="dicon">▾</span>
                <span className="dname">posts</span>
                <span className="dcount">{grouped.posts.length}</span>
              </div>
              {grouped.posts.map((d) => (
                <Link
                  key={d.slug}
                  href={`/admin/edit/${d.slug}`}
                  className={`file-row${d.slug === initial.slug ? " active" : ""}`}
                  onClick={() => openTab(d.slug)}
                >
                  <span className="ficon">{d.slug === initial.slug ? "◆" : "◇"}</span>
                  <span className="fname">{d.slug}.md</span>
                  {d.slug === initial.slug && isDirty && <span className="fbadge">M</span>}
                  {d.slug === initial.slug && !initial.slug && <span className="fbadge new">N</span>}
                  {d.status === "draft" && d.slug !== initial.slug && (
                    <span className="fbadge">D</span>
                  )}
                </Link>
              ))}
            </>
          )}
          {grouped.projects.length > 0 && (
            <>
              <div className="dir-row">
                <span className="dicon">▾</span>
                <span className="dname">projects</span>
                <span className="dcount">{grouped.projects.length}</span>
              </div>
              {grouped.projects.map((d) => (
                <Link
                  key={d.slug}
                  href={`/admin/edit/${d.slug}`}
                  className={`file-row${d.slug === initial.slug ? " active" : ""}`}
                  onClick={() => openTab(d.slug)}
                >
                  <span className="ficon">{d.slug === initial.slug ? "◆" : "◇"}</span>
                  <span className="fname">{d.slug}.md</span>
                  {d.slug === initial.slug && isDirty && <span className="fbadge">M</span>}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Center: editor main ── */}
      <div className="editor-main">
        <div className="tab-bar">
          {openTabs.map((t) => (
            <Link
              key={t}
              href={tabHref(t)}
              className={`etab${t === currentTab ? " active" : ""}`}
              onClick={() => openTab(t)}
            >
              <span className={`tdot${t === currentTab && isDirty ? "" : " saved"}`} />
              <span className="tname">{tabDisplayName(t)}</span>
              <span className="tclose" onClick={(e) => closeTab(e, t)} role="button" tabIndex={0}>
                ×
              </span>
            </Link>
          ))}
          <div className="tab-spacer" />
        </div>

        <div className={`editor-content-area${showPreview ? " split" : ""}`}>
          <div className="editor-write-pane">
            <input
              className="editor-title-input"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <RichEditor
              value={body}
              onChange={setBody}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview((p) => !p)}
              onSaveDraft={handleSaveDraft}
              saving={saving}
            />
          </div>
          {showPreview && (
            <div className="editor-preview-pane">
              <div className="pane-header">
                <span className="ph-label">preview</span>
                <span className="ph-spacer" />
                <Link className="ph-action" href={slug ? `/blog/${slug}` : "#"} target="_blank">full page</Link>
              </div>
              <div
                className="preview-body prose"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>

        <div className="editor-status-bar">
          <span className={`esb-pill${status === "draft" ? " draft" : ""}`}>{status}</span>
          {warnCount > 0 && (
            <span className="esb-warn" onClick={() => setSideTab("diag")} style={{ cursor: "pointer" }}>
              ⚠ {warnCount} warning{warnCount > 1 ? "s" : ""}
            </span>
          )}
          <span className="esb-spacer" />
          <span>{words} words · {readMin} min read</span>
          <button type="button" className="preview-btn" onClick={() => setShowPreview((p) => !p)}>
            {showPreview ? "single" : "split"}
          </button>
          <button type="button" className="save-btn" onClick={handleSaveDraft} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            className="ed-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            Publish
          </button>
        </div>
        {err && <p className="form-error" style={{ padding: "6px 14px", margin: 0 }}>{err}</p>}
      </div>

      {/* ── Right: sidebar ── */}
      <div className="ed-sidebar">
        <div className="sb-tabs">
          {(["meta", "outline", "diag"] as const).map((t) => (
            <div
              key={t}
              className={`sbt${sideTab === t ? " active" : ""}`}
              onClick={() => setSideTab(t)}
            >
              {t}
            </div>
          ))}
        </div>

        <div className="sb-body">
          {sideTab === "meta" && (
            <MetaTab
              slug={slug} setSlug={setSlug}
              summary={summary} setSummary={setSummary}
              kind={kind} setKind={setKind}
              status={status} setStatus={setStatus}
              featured={featured} setFeatured={setFeatured}
              tags={tags} setTags={setTags}
              tech={tech} setTech={setTech}
              topic={topic} setTopic={setTopic}
              seriesName={seriesName} setSeriesName={setSeriesName}
              seriesPart={seriesPart} setSeriesPart={setSeriesPart}
              coverImage={coverImage} setCoverImage={setCoverImage}
              onCover={onCover}
              words={words} readMin={readMin}
            />
          )}
          {sideTab === "outline" && <OutlineTab headings={headings} />}
          {sideTab === "diag" && <DiagTab diags={diags} />}
        </div>
      </div>
    </div>
  );
}

// ── Meta tab ─────────────────────────────────────────────────────────────────

function MetaTab({
  slug, setSlug,
  summary, setSummary,
  kind, setKind,
  status, setStatus,
  featured, setFeatured,
  tags, setTags,
  tech, setTech,
  topic, setTopic,
  seriesName, setSeriesName,
  seriesPart, setSeriesPart,
  coverImage, setCoverImage,
  onCover,
  words, readMin,
}: {
  slug: string; setSlug: (v: string) => void;
  summary: string; setSummary: (v: string) => void;
  kind: string; setKind: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  featured: boolean; setFeatured: (v: boolean) => void;
  tags: string; setTags: (v: string) => void;
  tech: string; setTech: (v: string) => void;
  topic: string; setTopic: (v: string) => void;
  seriesName: string; setSeriesName: (v: string) => void;
  seriesPart: string; setSeriesPart: (v: string) => void;
  coverImage: string | null; setCoverImage: (v: string | null) => void;
  onCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
  words: number; readMin: number;
}) {
  return (
    <>
      <div className="sb-section">
        <div className="sb-h">metadata</div>
        <div className="meta-field">
          <div className="mf-label">slug</div>
          <input className="mf-input" placeholder="from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="meta-field">
          <div className="mf-label">summary</div>
          <textarea className="mf-input" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <div className="meta-field" style={{ flex: 1 }}>
            <div className="mf-label">kind</div>
            <select className="mf-input" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="post">post</option>
              <option value="project">project</option>
              <option value="page">page</option>
            </select>
          </div>
          <div className="meta-field" style={{ flex: 1 }}>
            <div className="mf-label">status</div>
            <select className="mf-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-h">topic</div>
        <div className="topic-grid">
          {TOPIC_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              className={`tpick${topic === t ? " sel" : ""}`}
              style={topic === t ? { borderColor: topicColor(t), color: topicColor(t), background: topicColor(t) + "18" } : {}}
              onClick={() => setTopic(topic === t ? "" : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-h">tags</div>
        <input className="mf-input" placeholder="rust, performance, …" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>

      {kind === "project" && (
        <div className="sb-section">
          <div className="sb-h">tech stack</div>
          <input className="mf-input" placeholder="rust, postgres, …" value={tech} onChange={(e) => setTech(e.target.value)} />
        </div>
      )}

      <div className="sb-section">
        <div className="sb-h">series</div>
        <div style={{ display: "flex", gap: "6px" }}>
          <input className="mf-input" placeholder="Series name" value={seriesName} onChange={(e) => setSeriesName(e.target.value)} style={{ flex: 1 }} />
          <input className="mf-input" type="number" min={1} value={seriesPart} onChange={(e) => setSeriesPart(e.target.value)} style={{ width: "52px" }} />
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-h">options</div>
        <label style={{ display: "flex", alignItems: "center", gap: "7px", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured on homepage
        </label>
      </div>

      <div className="sb-section">
        <div className="sb-h">cover image</div>
        {coverImage && (
          <img src={coverImage} alt="cover" style={{ width: "100%", borderRadius: "var(--radius)", marginBottom: "6px" }} />
        )}
        <div style={{ display: "flex", gap: "6px" }}>
          <label className="btn-sm" style={{ cursor: "pointer" }}>
            {coverImage ? "Replace" : "Upload"}
            <input type="file" accept="image/*" hidden onChange={onCover} />
          </label>
          {coverImage && (
            <button type="button" className="btn-sm danger" onClick={() => setCoverImage(null)}>Remove</button>
          )}
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-h">stats</div>
        <div className="stat-row">
          <div className="stat-box"><div className="sv">{words}</div><div className="sl">words</div></div>
          <div className="stat-box"><div className="sv">{readMin}</div><div className="sl">min read</div></div>
        </div>
      </div>
    </>
  );
}

// ── Outline tab ───────────────────────────────────────────────────────────────

function OutlineTab({ headings }: { headings: { level: number; text: string; lineNum: number }[] }) {
  if (headings.length === 0) {
    return <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--faint)" }}>No headings yet.</p>;
  }
  return (
    <>
      <div className="sb-h">document structure</div>
      {headings.map((h, i) => (
        <div
          key={i}
          className={`outline-item${h.level === 3 ? " oi-sub2" : h.level === 2 ? " oi-sub" : ""}`}
        >
          <span className="oi-mark">H{h.level}</span>
          <span className={`oi-title${h.level === 1 ? " h1" : ""}`}>{h.text}</span>
          <span className="oi-line">L{h.lineNum}</span>
        </div>
      ))}
    </>
  );
}

// ── Diagnostics tab ───────────────────────────────────────────────────────────

function DiagTab({ diags }: { diags: { type: "warn" | "ok" | "info"; msg: string; sub: string }[] }) {
  const warns = diags.filter((d) => d.type === "warn");
  const oks = diags.filter((d) => d.type === "ok");
  const infos = diags.filter((d) => d.type === "info");

  const icon = (t: "warn" | "ok" | "info") =>
    t === "warn" ? "▲" : t === "ok" ? "✓" : "i";

  const group = (title: string, items: typeof diags) =>
    items.length === 0 ? null : (
      <div className="diag-group" key={title}>
        <div className="dg-h">{title} · {items.length}</div>
        {items.map((d, i) => (
          <div key={i} className={`diag-item ${d.type === "warn" ? "warn-d" : d.type}`}>
            <span className="di-ic">{icon(d.type)}</span>
            <div className="di-body">
              <div className="di-msg">{d.msg}</div>
              <div className="di-sub">{d.sub}</div>
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <>
      {group("warnings", warns)}
      {group("checks passed", oks)}
      {group("info", infos)}
    </>
  );
}
