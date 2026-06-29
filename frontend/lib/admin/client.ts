import { API } from "../api";
import { getToken } from "../auth/session";
import type {
  AdminItem,
  AdminNotificationList,
  EditDoc,
  RevisionDetail,
  RevisionItem,
  SaveReq,
} from "./types";

async function authed(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${getToken() ?? ""}`,
  };
  if (opts.body) headers["content-type"] = "application/json";
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers as Record<string, string>) },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${path} → ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res;
}

export const adminList = async (): Promise<AdminItem[]> =>
  (await authed("/api/admin/docs")).json();

export const adminGet = async (slug: string): Promise<EditDoc> =>
  (await authed(`/api/admin/docs/${slug}`)).json();

export const adminSave = async (req: SaveReq): Promise<{ slug: string }> =>
  (await authed("/api/admin/docs", { method: "POST", body: JSON.stringify(req) })).json();

export async function adminPreview(body: string): Promise<string> {
  const res = await authed("/api/admin/preview", {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  const { html } = (await res.json()) as { html: string };
  return html;
}

export const adminDelete = (slug: string) =>
  authed(`/api/admin/docs/${slug}`, { method: "DELETE" });

export const adminDuplicate = async (slug: string): Promise<{ slug: string }> =>
  (await authed(`/api/admin/docs/${slug}/duplicate`, { method: "POST" })).json();

export const adminRevisions = async (slug: string): Promise<RevisionItem[]> =>
  (await authed(`/api/admin/docs/${slug}/revisions`)).json();

export const adminRevision = async (slug: string, id: string): Promise<RevisionDetail> =>
  (await authed(`/api/admin/docs/${slug}/revisions/${id}`)).json();

export async function adminSetStatus(slug: string, status: string): Promise<void> {
  const doc = await adminGet(slug);
  const metadata = { ...(doc.metadata ?? {}) };
  if (status === "draft") delete metadata.scheduled_for;
  await adminSave({
    slug: doc.slug,
    kind: doc.kind,
    title: doc.title,
    summary: doc.summary ?? "",
    status,
    body: doc.body_markdown,
    cover_image: doc.cover_image,
    metadata,
  });
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/api/admin/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${getToken() ?? ""}` },
    body: form,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upload → ${res.status}`);
  const { url } = (await res.json()) as { url: string };
  return url;
}

export type { AdminNotification } from "./types";

export const adminListNotifications = async (): Promise<AdminNotificationList> =>
  (await authed("/api/admin/notifications")).json();

export async function adminMarkNotificationsRead(ids: string[]): Promise<void> {
  await authed("/api/admin/notifications/read", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export async function adminMarkAllNotificationsRead(): Promise<void> {
  await authed("/api/admin/notifications/read-all", { method: "POST", body: "{}" });
}
