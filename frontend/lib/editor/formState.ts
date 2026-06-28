/**
 * Editor field state ↔ API document shape.
 *
 * `fieldsFromDoc` / `buildDocMetadata` are the only mapping between TipTap form state
 * and the save payload. `isEditorDirty` compares every editable field (including metadata)
 * so the status-bar unsaved indicator stays accurate.
 */
import type { DocMetadata, EditDoc } from "../admin/types";
import {
  applyScheduledMetadata,
  clearScheduledMetadata,
  scheduleInputFromMetadata,
} from "../adminDocs";

export const BLANK_DOC: EditDoc = {
  slug: "",
  kind: "post",
  title: "",
  summary: null,
  status: "draft",
  body_markdown: "",
  cover_image: null,
  metadata: {},
};

export const csv = (value: unknown): string =>
  Array.isArray(value) ? value.join(", ") : "";

export const toList = (v: string): string[] =>
  v.split(",").map((s) => s.trim()).filter(Boolean);

export type EditorFields = {
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
};

export function fieldsFromDoc(doc: EditDoc): EditorFields {
  const md = doc.metadata ?? {};
  const series = (md.series ?? null) as { name: string; part: number } | null;
  return {
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary ?? "",
    kind: doc.kind,
    status: doc.status,
    body: doc.body_markdown,
    coverImage: doc.cover_image,
    featured: Boolean(md.featured),
    tags: csv(md.tags),
    tech: csv(md.tech),
    topic: (md.topic as string | undefined) ?? "",
    seriesName: series?.name ?? "",
    seriesPart: String(series?.part ?? 1),
    scheduleAt: scheduleInputFromMetadata(md),
  };
}

export function buildDocMetadata(
  base: DocMetadata,
  fields: Pick<
    EditorFields,
    "featured" | "topic" | "seriesName" | "seriesPart" | "tags" | "tech" | "kind" | "scheduleAt"
  >,
): DocMetadata {
  let next: DocMetadata = { ...base };
  next.featured = fields.featured;
  if (fields.topic) next.topic = fields.topic;
  else delete next.topic;
  if (fields.seriesName.trim()) {
    next.series = { name: fields.seriesName.trim(), part: Number(fields.seriesPart) || 1 };
  } else delete next.series;
  if (toList(fields.tags).length) next.tags = toList(fields.tags);
  else delete next.tags;
  if (fields.kind === "project" && toList(fields.tech).length) next.tech = toList(fields.tech);
  else delete next.tech;
  next = applyScheduledMetadata(next, fields.scheduleAt);
  return next;
}

export function buildDocMetadataForPublish(
  base: DocMetadata,
  fields: Parameters<typeof buildDocMetadata>[1],
  mode: "now" | "schedule",
  scheduleDate: string,
): DocMetadata {
  const merged = buildDocMetadata(base, fields);
  if (mode === "now") return clearScheduledMetadata(merged);
  return applyScheduledMetadata(merged, scheduleDate);
}

export function isEditorDirty(initial: EditDoc, current: EditorFields): boolean {
  const baseline = fieldsFromDoc(initial);
  return (
    current.title !== baseline.title ||
    current.slug !== baseline.slug ||
    current.summary !== baseline.summary ||
    current.kind !== baseline.kind ||
    current.status !== baseline.status ||
    current.body !== baseline.body ||
    current.coverImage !== baseline.coverImage ||
    current.featured !== baseline.featured ||
    current.tags !== baseline.tags ||
    current.tech !== baseline.tech ||
    current.topic !== baseline.topic ||
    current.seriesName !== baseline.seriesName ||
    current.seriesPart !== baseline.seriesPart ||
    current.scheduleAt !== baseline.scheduleAt
  );
}
