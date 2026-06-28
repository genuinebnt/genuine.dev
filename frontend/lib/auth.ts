import { API } from "./api";

const KEY = "folio_token";

export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
export const setToken = (t: string) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("invalid credentials");
  const { token } = (await res.json()) as { token: string };
  setToken(token);
}

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
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res;
}

export type AdminItem = { slug: string; title: string; kind: string; status: string };
export type EditDoc = {
  slug: string;
  kind: string;
  title: string;
  summary: string | null;
  status: string;
  body_markdown: string;
};
export type SaveReq = {
  slug: string;
  kind: string;
  title: string;
  summary: string;
  status: string;
  body: string;
};

export const adminList = async (): Promise<AdminItem[]> =>
  (await authed("/api/admin/docs")).json();
export const adminGet = async (slug: string): Promise<EditDoc> =>
  (await authed(`/api/admin/docs/${slug}`)).json();
export const adminSave = (req: SaveReq) =>
  authed("/api/admin/docs", { method: "POST", body: JSON.stringify(req) });
export const adminDelete = (slug: string) =>
  authed(`/api/admin/docs/${slug}`, { method: "DELETE" });
