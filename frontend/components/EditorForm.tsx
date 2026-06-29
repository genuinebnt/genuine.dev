"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Editor } from "@tiptap/react";
import {
  adminDuplicate,
  adminList,
  adminPreview,
  adminSave,
  uploadImage,
  type AdminItem,
  type EditDoc,
  type RevisionDetail,
} from "../lib/auth";
import { effectiveStatus, clearScheduledMetadata } from "../lib/adminDocs";
import {
  BLANK_DOC,
  buildDocMetadata,
  buildDocMetadataForPublish,
  fieldsFromDoc,
  isEditorDirty,
  type EditorFields,
} from "../lib/editor/formState";
import {
  buildEditorDiagnostics,
  parseHeadings,
  parseOutlineBlocks,
  publishChecks,
  type EditorDiag,
} from "../lib/editorDiagnostics";
import { publicDocPath } from "../lib/cmsPages";
import { lineCount, readingMinutes, wordCount } from "../lib/readingStats";
import {
  clearEditorAutosave,
  readEditorAutosave,
  writeEditorAutosave,
  writeReadingPrefs,
  readReadingPrefs,
} from "../lib/siteExtras";
import EditorDiagTab from "./editor/EditorDiagTab";
import EditorHistoryTab from "./editor/EditorHistoryTab";
import { EditorInspector, describeSelection, type InspectorType } from "./editor/EditorInspector";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import EditorFileTree, { groupEditorDocs } from "./editor/EditorFileTree";
import EditorMetaTab from "./editor/EditorMetaTab";
import EditorOutlineTab from "./editor/EditorOutlineTab";
import PublishModal from "./editor/PublishModal";
import {
  readTabs,
  tabDisplayName,
  tabHref,
  tabSlug,
  TAB_NEW,
  writeTabs,
} from "./editor/editorTabs";
import { RichEditor, editorMarkdown } from "./editor/RichEditor";

function fieldSnapshot(state: {
  title: string;
  slug: string;
  summary: string;
  kind: string;
  status: string;
  body: string;
  coverImage: string | null;
  featured: boolean;
  tags: string;
  tech: string;
  topic: string;
  seriesName: string;
  seriesPart: string;
  scheduleAt: string;
}): EditorFields {
  return state;
}

export default function EditorForm({ initial = BLANK_DOC }: { initial?: EditDoc }) {
  const router = useRouter();
  const baseline = useMemo(() => fieldsFromDoc(initial), [initial]);
  const baseMetadata = initial.metadata ?? {};

  const [title, setTitle] = useState(baseline.title);
  const [slug, setSlug] = useState(baseline.slug);
  const [summary, setSummary] = useState(baseline.summary);
  const [kind, setKind] = useState(baseline.kind);
  const [status, setStatus] = useState(baseline.status);
  const [body, setBody] = useState(baseline.body);
  const [coverImage, setCoverImage] = useState(baseline.coverImage);
  const [featured, setFeatured] = useState(baseline.featured);
  const [seriesName, setSeriesName] = useState(baseline.seriesName);
  const [seriesPart, setSeriesPart] = useState(baseline.seriesPart);
  const [tags, setTags] = useState(baseline.tags);
  const [tech, setTech] = useState(baseline.tech);
  const [topic, setTopic] = useState(baseline.topic);
  const [scheduleAt, setScheduleAt] = useState(baseline.scheduleAt);

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sideTab, setSideTab] = useState<"meta" | "outline" | "diag" | "history">("meta");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [showDiscard, setShowDiscard] = useState(false);
  const [selectedEl, setSelectedEl] = useState<InspectorType | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const prevSelRef = useRef<InspectorType | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [docs, setDocs] = useState<AdminItem[]>([]);
  const [ftFilter, setFtFilter] = useState("");
  const [recovery, setRecovery] = useState<ReturnType<typeof readEditorAutosave>>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [publishScheduleDate, setPublishScheduleDate] = useState("");
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const autosaveKey = initial.slug || TAB_NEW;

  const currentFields = fieldSnapshot({
    title,
    slug,
    summary,
    kind,
    status,
    body,
    coverImage,
    featured,
    tags,
    tech,
    topic,
    seriesName,
    seriesPart,
    scheduleAt,
  });

  const isDirty = isEditorDirty(initial, currentFields);
  const words = useMemo(() => wordCount(body), [body]);
  const lines = useMemo(() => lineCount(body), [body]);
  const readMin = readingMinutes(words);
  const headings = useMemo(() => parseHeadings(body), [body]);
  const outlineBlocks = useMemo(() => parseOutlineBlocks(body), [body]);
  const grouped = useMemo(() => groupEditorDocs(docs, ftFilter), [docs, ftFilter]);
  const knownSlugs = useMemo(() => new Set(docs.map((d) => d.slug)), [docs]);
  const slugTaken = useMemo(
    () => Boolean(slug.trim() && slug !== initial.slug && knownSlugs.has(slug.trim())),
    [slug, initial.slug, knownSlugs],
  );

  const metaFields = useMemo(
    () => ({ featured, topic, seriesName, seriesPart, tags, tech, kind, scheduleAt }),
    [featured, topic, seriesName, seriesPart, tags, tech, kind, scheduleAt],
  );

  const diags = useMemo(
    () =>
      buildEditorDiagnostics({
        title,
        slug,
        summary,
        tags,
        topic,
        body,
        knownSlugs,
        slugTaken,
      }),
    [title, slug, summary, tags, topic, body, knownSlugs, slugTaken],
  );
  const warnCount = diags.filter((d) => d.type === "warn").length;
  const publishChecklist = useMemo(() => publishChecks(diags), [diags]);

  const statusLabel = useMemo(
    () =>
      effectiveStatus({
        status,
        metadata: scheduleAt ? { scheduled_for: scheduleAt } : {},
      }),
    [status, scheduleAt],
  );

  const canonicalUrl = useMemo(() => {
    const path = publicDocPath({ slug: slug || "…", kind });
    return path ? `https://genuine.dev${path}` : "";
  }, [slug, kind]);

  const currentTab = tabSlug(initial);
  const [openTabs, setOpenTabs] = useState<string[]>(() => [currentTab]);

  function currentBody(): string {
    const ed = editorRef.current;
    return ed ? editorMarkdown(ed) : body;
  }

  function metadataFields() {
    return buildDocMetadata(baseMetadata, metaFields);
  }

  function jumpToHeading(text: string) {
    const ed = editorRef.current;
    if (!ed) return;
    let target: number | null = null;
    ed.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.textContent.trim() === text.trim()) {
        target = pos;
        return false;
      }
    });
    if (target != null) {
      ed.chain().focus().setTextSelection(target + 1).scrollIntoView().run();
    }
  }

  function jumpToDiag(diag: EditorDiag) {
    setShowPublishModal(false);
    setSideTab("diag");
    if (diag.headingText) jumpToHeading(diag.headingText);
  }

  function jumpToLine(lineNum: number) {
    const heading = headings.find((h) => h.lineNum === lineNum);
    if (heading) jumpToHeading(heading.text);
  }

  function openTab(nextSlug: string) {
    const next = openTabs.includes(nextSlug) ? openTabs : [...openTabs, nextSlug];
    writeTabs(next);
    setOpenTabs(next);
  }

  function closeTab(e: React.MouseEvent, tab: string) {
    e.preventDefault();
    e.stopPropagation();
    const next = openTabs.filter((t) => t !== tab);
    writeTabs(next);
    setOpenTabs(next);
    if (tab === currentTab && next.length > 0) {
      const target = next[next.length - 1];
      router.push(target === TAB_NEW ? "/admin/new" : `/admin/edit/${target}`);
    } else if (tab === currentTab) {
      router.push("/admin");
    }
  }

  async function persist(
    redirectAdmin: boolean,
    opts: { forceDraft?: boolean; forcePublished?: boolean; metadata?: ReturnType<typeof metadataFields> } = {},
  ) {
    setSaving(true);
    setErr(null);
    const saveStatus = opts.forceDraft ? "draft" : opts.forcePublished ? "published" : status;
    const saveBody = currentBody();
    let metadata = opts.metadata ?? metadataFields();
    if (saveStatus === "published") metadata = clearScheduledMetadata(metadata);
    try {
      const { slug: savedSlug } = await adminSave({
        slug,
        kind,
        title,
        summary: summary || "",
        status: saveStatus,
        body: saveBody,
        cover_image: coverImage,
        metadata,
      });
      setBody(saveBody);
      setStatus(saveStatus);
      if (saveStatus === "published") setScheduleAt("");
      clearEditorAutosave(autosaveKey);
      setRecovery(null);
      setHistoryRefresh((k) => k + 1);
      if (savedSlug && savedSlug !== slug) setSlug(savedSlug);
      if (redirectAdmin) router.push("/admin");
      else if (savedSlug && savedSlug !== initial.slug) router.replace(`/admin/edit/${savedSlug}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed — are you logged in?");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    await persist(false, { forceDraft: true });
  }

  function openPublishModal() {
    if (editorRef.current) setBody(editorMarkdown(editorRef.current));
    setPublishScheduleDate(scheduleAt);
    setShowPublishModal(true);
  }

  async function handlePublishFromModal() {
    const metadata = buildDocMetadataForPublish(baseMetadata, metaFields, publishMode, publishScheduleDate);
    if (publishMode === "schedule") {
      if (publishScheduleDate) setScheduleAt(publishScheduleDate);
      await persist(true, { forceDraft: true, metadata });
    } else {
      setScheduleAt("");
      await persist(true, { forcePublished: true, metadata });
    }
    setShowPublishModal(false);
  }

  async function handleDuplicate() {
    if (!initial.slug) return;
    try {
      const { slug: newSlug } = await adminDuplicate(initial.slug);
      router.push(`/admin/edit/${newSlug}`);
    } catch {
      setErr("Duplicate failed.");
    }
  }

  // ── Sidebar collapse (persisted) ──
  useEffect(() => {
    setTreeCollapsed(localStorage.getItem("editorTreeCollapsed") === "1");
    setSidebarCollapsed(localStorage.getItem("editorSidebarCollapsed") === "1");
  }, []);

  function toggleTree() {
    setTreeCollapsed((c) => {
      const next = !c;
      localStorage.setItem("editorTreeCollapsed", next ? "1" : "0");
      return next;
    });
  }
  function toggleSidebar() {
    setSidebarCollapsed((c) => {
      const next = !c;
      localStorage.setItem("editorSidebarCollapsed", next ? "1" : "0");
      return next;
    });
  }
  /** Focus mode — collapse both rails (or restore both if already collapsed). */
  function toggleFocus() {
    const collapse = !(treeCollapsed && sidebarCollapsed);
    setTreeCollapsed(collapse);
    setSidebarCollapsed(collapse);
    localStorage.setItem("editorTreeCollapsed", collapse ? "1" : "0");
    localStorage.setItem("editorSidebarCollapsed", collapse ? "1" : "0");
  }

  function performCancel() {
    clearEditorAutosave(autosaveKey);
    router.push("/admin");
  }

  function handleCancel() {
    if (isDirty) {
      setShowDiscard(true);
      return;
    }
    performCancel();
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setCoverImage(await uploadImage(file));
    } catch {
      setErr("Cover image upload failed.");
    }
  }

  function restoreRecovery() {
    if (!recovery) return;
    setTitle(recovery.title);
    setSlug(recovery.slug);
    setSummary(recovery.summary);
    setBody(recovery.body);
    setRecovery(null);
  }

  /** Load a stored revision back into the editor as unsaved changes (status kept). */
  function restoreRevision(rev: RevisionDetail) {
    const f = fieldsFromDoc({
      slug,
      kind,
      title: rev.title,
      summary: rev.summary,
      status: rev.status,
      body_markdown: rev.body_markdown,
      cover_image: rev.cover_image,
      metadata: rev.metadata,
    });
    setTitle(f.title);
    setSummary(f.summary);
    setCoverImage(f.coverImage);
    setFeatured(f.featured);
    setSeriesName(f.seriesName);
    setSeriesPart(f.seriesPart);
    setTags(f.tags);
    setTech(f.tech);
    setTopic(f.topic);
    setBody(f.body);
    editorRef.current?.commands.setContent(rev.body_markdown);
    setSideTab("meta");
  }

  useEffect(() => {
    const existing = readTabs();
    const next = existing.includes(currentTab) ? existing : [...existing, currentTab];
    writeTabs(next);
    setOpenTabs(next);
  }, [currentTab]);

  useEffect(() => {
    adminList().then(setDocs).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = readEditorAutosave(autosaveKey);
    if (saved && saved.savedAt > Date.now() - 7 * 24 * 60 * 60 * 1000) {
      if (saved.body !== initial.body_markdown || saved.title !== initial.title) {
        setRecovery(saved);
      }
    }
  }, [autosaveKey, initial.body_markdown, initial.title]);

  useEffect(() => {
    if (!showPreview) return;
    const markdown = currentBody();
    if (!markdown.trim()) {
      setPreviewHtml("");
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    const timer = window.setTimeout(() => {
      adminPreview(markdown)
        .then((html) => {
          setPreviewHtml(html);
          setPreviewError(null);
        })
        .catch(() => setPreviewError("Preview failed — check login and API."))
        .finally(() => setPreviewLoading(false));
    }, 280);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, showPreview, topic]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!isDirty && !title && !body) return;
      writeEditorAutosave(autosaveKey, {
        title,
        slug,
        summary,
        body: currentBody(),
        savedAt: Date.now(),
      });
    }, 8000);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosaveKey, title, slug, summary, body, isDirty]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s") {
        e.preventDefault();
        void handleSaveDraft();
      }
      if (e.key === "p" && e.shiftKey) {
        e.preventDefault();
        if (!showPreview && editorRef.current) setBody(editorMarkdown(editorRef.current));
        setShowPreview((p) => !p);
      }
      if (e.key === "l" && e.shiftKey) {
        e.preventDefault();
        const prefs = readReadingPrefs();
        writeReadingPrefs({ focusMode: !prefs.focusMode });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreview]);

  return (
    <div
      className={`editor-shell${treeCollapsed ? " left-collapsed" : ""}${
        sidebarCollapsed ? " right-collapsed" : ""
      }`}
    >
      <EditorFileTree
        docs={docs}
        filter={ftFilter}
        onFilterChange={setFtFilter}
        collapsed={treeCollapsed}
        onToggleCollapse={toggleTree}
        grouped={grouped}
        activeSlug={initial.slug}
        isDirty={isDirty}
        isNewDoc={!initial.slug}
        onOpenTab={openTab}
      />

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
              <span className="tname">{tabDisplayName(t, currentTab, title)}</span>
              <span className="tclose" onClick={(e) => closeTab(e, t)} role="button" tabIndex={0}>
                ×
              </span>
            </Link>
          ))}
          <div className="tab-spacer" />
        </div>

        {recovery && (
          <div className="editor-recovery-toast">
            <span>Recovered local draft from {new Date(recovery.savedAt).toLocaleString()}</span>
            <button type="button" className="ts-btn" onClick={restoreRecovery}>
              Restore
            </button>
            <button
              type="button"
              className="ts-btn"
              onClick={() => {
                clearEditorAutosave(autosaveKey);
                setRecovery(null);
              }}
            >
              Dismiss
            </button>
          </div>
        )}

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
              onEditorReady={(ed) => {
                editorRef.current = ed;
                // Surface the selected element to the side panel (contextual inspector).
                const syncSelection = () => {
                  const next = describeSelection(ed);
                  if (next !== prevSelRef.current) {
                    prevSelRef.current = next;
                    setSelectedEl(next);
                    setInspectorOpen(next != null);
                  }
                };
                ed.on("selectionUpdate", syncSelection);
                ed.on("transaction", syncSelection);
                syncSelection();
              }}
            />
          </div>
          {showPreview && (
            <div className="editor-preview-pane">
              <div className="pane-header">
                <span className="ph-label">preview</span>
                <span className="ph-spacer" />
                {previewLoading && <span className="ph-status">rendering…</span>}
                <Link className="ph-action" href={slug ? `/blog/${slug}` : "#"} target="_blank">
                  full page
                </Link>
              </div>
              <div className="preview-body prose article" data-topic={topic || undefined}>
                {previewError ? (
                  <p className="dim">{previewError}</p>
                ) : previewLoading && !previewHtml ? (
                  <p className="dim">Rendering preview…</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="editor-status-bar">
          <span className={`esb-pill${statusLabel === "draft" ? " draft" : ""}`}>{statusLabel}</span>
          {warnCount > 0 && (
            <span className="esb-warn" onClick={() => setSideTab("diag")} style={{ cursor: "pointer" }}>
              ⚠ {warnCount} warning{warnCount > 1 ? "s" : ""}
            </span>
          )}
          <span>{lines} lines</span>
          <span className="esb-spacer" />
          <span>
            {words} words · {readMin} min read
          </span>
          {isDirty && <span style={{ color: "var(--warn)" }}>● unsaved</span>}
          <button
            type="button"
            className="preview-btn"
            onClick={toggleFocus}
            title="Toggle focus mode — hide both side panels"
          >
            {treeCollapsed && sidebarCollapsed ? "exit focus" : "focus"}
          </button>
          <button type="button" className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          {initial.slug && (
            <button type="button" className="preview-btn" onClick={() => void handleDuplicate()}>
              duplicate
            </button>
          )}
          <button
            type="button"
            className="preview-btn"
            onClick={() => {
              if (!showPreview && editorRef.current) setBody(editorMarkdown(editorRef.current));
              setShowPreview((p) => !p);
            }}
          >
            {showPreview ? "single" : "split"}
          </button>
          <button type="button" className="save-btn" onClick={() => void handleSaveDraft()} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button type="button" className="ed-save-btn" onClick={openPublishModal} disabled={saving}>
            Publish
          </button>
        </div>
        {err && <p className="form-error" style={{ padding: "6px 14px", margin: 0 }}>{err}</p>}
      </div>

      {sidebarCollapsed ? (
        <aside className="ed-sidebar rail-collapsed">
          <button
            type="button"
            className="rail-reopen"
            title="Expand panel"
            aria-label="Expand panel"
            onClick={toggleSidebar}
          >
            «
          </button>
        </aside>
      ) : (
        <div className="ed-sidebar">
          {selectedEl && inspectorOpen && editorRef.current ? (
            <EditorInspector
              key={`${selectedEl}-${editorRef.current.state.selection.from}`}
              editor={editorRef.current}
              type={selectedEl}
              onBack={() => setInspectorOpen(false)}
            />
          ) : (
          <>
          <div className="sb-tabs">
            <button
              type="button"
              className="sb-collapse"
              title="Collapse panel"
              aria-label="Collapse panel"
              onClick={toggleSidebar}
            >
              »
            </button>
            {(["meta", "outline", "diag", "history"] as const).map((t) => (
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
            <EditorMetaTab
              slug={slug}
              setSlug={setSlug}
              summary={summary}
              setSummary={setSummary}
              kind={kind}
              setKind={setKind}
              status={status}
              setStatus={setStatus}
              scheduleAt={scheduleAt}
              setScheduleAt={setScheduleAt}
              featured={featured}
              setFeatured={setFeatured}
              tags={tags}
              setTags={setTags}
              tech={tech}
              setTech={setTech}
              topic={topic}
              setTopic={setTopic}
              seriesName={seriesName}
              setSeriesName={setSeriesName}
              seriesPart={seriesPart}
              setSeriesPart={setSeriesPart}
              coverImage={coverImage}
              setCoverImage={setCoverImage}
              onCover={onCover}
              words={words}
              readMin={readMin}
            />
          )}
          {sideTab === "outline" && (
            <EditorOutlineTab headings={headings} blocks={outlineBlocks} onJump={jumpToLine} />
          )}
          {sideTab === "diag" && <EditorDiagTab diags={diags} onJump={jumpToDiag} />}
          {sideTab === "history" && (
            <EditorHistoryTab
              slug={initial.slug}
              isNewDoc={!initial.slug}
              refreshKey={historyRefresh}
              getCurrentBody={currentBody}
              onRestore={restoreRevision}
            />
          )}
          </div>
          </>
          )}
        </div>
      )}

      <PublishModal
        open={showPublishModal}
        checks={publishChecklist}
        canonicalUrl={canonicalUrl}
        publishMode={publishMode}
        scheduleDate={publishScheduleDate}
        saving={saving}
        onClose={() => setShowPublishModal(false)}
        onSaveDraft={async () => {
          await handleSaveDraft();
          setShowPublishModal(false);
        }}
        onPublish={() => void handlePublishFromModal()}
        onModeChange={setPublishMode}
        onScheduleDateChange={setPublishScheduleDate}
        onJumpTo={jumpToDiag}
      />
      <ConfirmDialog
        open={showDiscard}
        title="Discard changes?"
        message="You have unsaved changes. Leaving now will discard them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        danger
        onConfirm={() => {
          setShowDiscard(false);
          performCancel();
        }}
        onCancel={() => setShowDiscard(false)}
      />
    </div>
  );
}
