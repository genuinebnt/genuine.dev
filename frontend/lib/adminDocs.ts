/**
 * Admin list helpers — filters, stats, and schedule metadata.
 *
 * Scheduling is stored as `metadata.scheduled_for` on draft rows until publish clears it.
 * There is no backend `scheduled` status enum yet; `effectiveStatus` is the single place
 * that derives the UI label from draft + timestamp.
 */
import type { AdminItem } from "./admin/types";
import { docMetadata, postTags } from "./metadata";
import { projectAccentColor } from "./projects";
import { deriveTopic, topicColor, topicCssClass } from "./topic";

export type AdminFilter =
  | "all"
  | "posts"
  | "projects"
  | "pages"
  | "drafts"
  | "published"
  | "scheduled";

export const ADMIN_FILTERS: AdminFilter[] = [
  "all",
  "posts",
  "projects",
  "pages",
  "drafts",
  "published",
  "scheduled",
];

/** Scheduled posts are drafts with a future `metadata.scheduled_for` (no backend enum yet). */
export function effectiveStatus(row: Pick<AdminItem, "status" | "metadata">): string {
  if (row.status === "draft" && row.metadata?.scheduled_for) return "scheduled";
  return row.status;
}

export function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "published":
      return "published";
    case "draft":
      return "draft";
    case "scheduled":
      return "scheduled";
    default:
      return "draft";
  }
}

export function adminRowTags(row: Pick<AdminItem, "metadata">): string[] {
  return postTags(docMetadata(row));
}

export function adminRowTopic(row: Pick<AdminItem, "metadata">): string {
  const topic = docMetadata(row).topic;
  if (typeof topic !== "string" || !topic.trim()) return "";
  return topic.toLowerCase();
}

/** Left-bar accent — same derivation as the public writing index (topic, else first tag). */
export function adminRowAccent(row: Pick<AdminItem, "slug" | "kind" | "metadata">): {
  cssClass?: string;
  color: string;
} {
  if (row.kind === "project") {
    const portfolio = projectAccentColor(row.slug);
    if (portfolio) return { color: portfolio };
  }

  const topic = deriveTopic(docMetadata(row));
  if (!topic) return { color: "var(--border2)" };

  const cssClass = topicCssClass(topic);
  return { cssClass: cssClass || undefined, color: topicColor(topic) };
}

export type AdminRowDate = {
  label: string;
  tone: "default" | "scheduled" | "empty";
};

/** Date cell — publish date, or scheduled target when status is scheduled. */
export function adminRowDateDisplay(
  row: Pick<AdminItem, "status" | "metadata" | "published_at">,
): AdminRowDate {
  const displayStatus = effectiveStatus(row);
  if (displayStatus === "scheduled" && row.metadata?.scheduled_for) {
    return { label: String(row.metadata.scheduled_for).slice(0, 10), tone: "scheduled" };
  }
  if (row.published_at) return { label: row.published_at, tone: "default" };
  return { label: "—", tone: "empty" };
}

export function adminRowDate(row: Pick<AdminItem, "status" | "metadata" | "published_at">): string {
  return adminRowDateDisplay(row).label;
}

export function filterAdminRows(rows: AdminItem[], filter: AdminFilter): AdminItem[] {
  switch (filter) {
    case "posts":
      return rows.filter((r) => r.kind === "post");
    case "projects":
      return rows.filter((r) => r.kind === "project");
    case "pages":
      return rows.filter((r) => r.kind === "page");
    case "drafts":
      return rows.filter((r) => effectiveStatus(r) === "draft");
    case "published":
      return rows.filter((r) => effectiveStatus(r) === "published");
    case "scheduled":
      return rows.filter((r) => effectiveStatus(r) === "scheduled");
    default:
      return rows;
  }
}

export function filterFromSearchParams(params: URLSearchParams): AdminFilter | null {
  const kind = params.get("kind");
  const status = params.get("status");
  if (status === "draft") return "drafts";
  if (status === "published") return "published";
  if (status === "scheduled") return "scheduled";
  if (kind === "post") return "posts";
  if (kind === "project") return "projects";
  if (kind === "page") return "pages";
  return null;
}

export function summarizeAdminStats(rows: AdminItem[]) {
  return {
    total: rows.length,
    published: rows.filter((r) => effectiveStatus(r) === "published").length,
    drafts: rows.filter((r) => effectiveStatus(r) === "draft").length,
    scheduled: rows.filter((r) => effectiveStatus(r) === "scheduled").length,
    projects: rows.filter((r) => r.kind === "project").length,
    pages: rows.filter((r) => r.kind === "page").length,
  };
}

export function applyTopicFilter(rows: AdminItem[], topic: string | null): AdminItem[] {
  if (!topic) return rows;
  return rows.filter((r) => adminRowTopic(r) === topic);
}

export function applyTagFilter(rows: AdminItem[], tag: string | null): AdminItem[] {
  if (!tag) return rows;
  return rows.filter((r) => adminRowTags(r).includes(tag));
}

export function applyAdminSearch(rows: AdminItem[], query: string): AdminItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.slug.includes(q) ||
      adminRowTags(r).some((t) => t.toLowerCase().includes(q)),
  );
}

/** Tag chips in admin — only tags stored on at least one document. */
export function adminTagsInUse(rows: AdminItem[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const tag of adminRowTags(row)) seen.add(tag);
  }
  return [...seen].sort();
}

export function applyScheduledMetadata(
  metadata: Record<string, unknown>,
  scheduleAt: string,
): Record<string, unknown> {
  const next = { ...metadata };
  if (scheduleAt.trim()) next.scheduled_for = new Date(scheduleAt).toISOString();
  else delete next.scheduled_for;
  return next;
}

export function clearScheduledMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const next = { ...metadata };
  delete next.scheduled_for;
  return next;
}

export function scheduleInputFromMetadata(metadata?: Record<string, unknown>): string {
  const raw = metadata?.scheduled_for;
  if (typeof raw !== "string" || !raw) return "";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}
