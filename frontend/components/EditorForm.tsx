"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminSave, uploadImage, type DocMetadata, type EditDoc } from "../lib/auth";
import { PageHeader } from "./ui/PageHeader";
import { RichEditor } from "./editor/RichEditor";

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
const toList = (value: string): string[] =>
  value.split(",").map((s) => s.trim()).filter(Boolean);

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

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function buildMetadata(): DocMetadata {
    // Preserve unknown keys; overwrite the ones the form owns.
    const next: DocMetadata = { ...md };
    next.featured = featured;
    if (seriesName.trim()) next.series = { name: seriesName.trim(), part: Number(seriesPart) || 1 };
    else delete next.series;
    if (toList(tags).length) next.tags = toList(tags);
    else delete next.tags;
    if (kind === "project" && toList(tech).length) next.tech = toList(tech);
    else delete next.tech;
    return next;
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await adminSave({
        slug,
        kind,
        title,
        summary,
        status,
        body,
        cover_image: coverImage,
        metadata: buildMetadata(),
      });
      router.push("/admin");
    } catch {
      setErr("Save failed — are you logged in?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Editor" title={title.trim() || "Untitled"} />
      <form className="editor-layout" onSubmit={onSubmit}>
        <div className="editor-main">
          <input
            className="editor-title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <RichEditor value={body} onChange={setBody} />
        </div>

        <aside className="editor-side">
          <button className="btn editor-save" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          {err && <p className="form-error">{err}</p>}

          <SideField label="Slug">
            <input placeholder="from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </SideField>
          <SideField label="Summary">
            <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </SideField>
          <div className="tt-row">
            <SideField label="Kind">
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="post">post</option>
                <option value="project">project</option>
                <option value="page">page</option>
              </select>
            </SideField>
            <SideField label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </SideField>
          </div>

          <label className="editor-check">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Featured on homepage
          </label>

          <SideField label="Tags (comma-separated)">
            <input value={tags} onChange={(e) => setTags(e.target.value)} />
          </SideField>

          {kind === "project" && (
            <SideField label="Tech (comma-separated)">
              <input value={tech} onChange={(e) => setTech(e.target.value)} />
            </SideField>
          )}

          <div className="tt-row">
            <SideField label="Series name">
              <input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} />
            </SideField>
            <SideField label="Part" width="64px">
              <input
                type="number"
                min={1}
                value={seriesPart}
                onChange={(e) => setSeriesPart(e.target.value)}
              />
            </SideField>
          </div>

          <SideField label="Cover image">
            {coverImage && <img className="editor-cover" src={coverImage} alt="cover" />}
            <div className="editor-cover-actions">
              <label className="btn-sm">
                {coverImage ? "Replace" : "Upload"}
                <input type="file" accept="image/*" hidden onChange={onCover} />
              </label>
              {coverImage && (
                <button type="button" className="btn-sm danger" onClick={() => setCoverImage(null)}>
                  Remove
                </button>
              )}
            </div>
          </SideField>
        </aside>
      </form>
    </>
  );
}

function SideField({
  label,
  children,
  width,
}: {
  label: string;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <label className="side-field" style={{ width }}>
      <span className="side-field-label">{label}</span>
      {children}
    </label>
  );
}
