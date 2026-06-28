// Server-side (SSR) reaches the backend directly (in prod: http://backend:3001);
// client-side uses the public URL (in prod: "" → same-origin via Caddy).
export const API =
  typeof window === "undefined"
    ? (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001");

export type PostItem = {
  slug: string;
  title: string;
  summary: string | null;
  reading_min: number;
  date: string | null;
};

export type PostDetail = PostItem & { body_html: string; kind: string };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const getPosts = () => get<PostItem[]>("/api/posts");
export const getProjects = () => get<PostItem[]>("/api/projects");
export const searchPosts = (q: string) =>
  get<PostItem[]>(`/api/search?q=${encodeURIComponent(q)}`);

export async function getDoc(
  kind: "posts" | "projects" | "pages",
  slug: string,
): Promise<PostDetail | null> {
  const res = await fetch(`${API}/api/${kind}/${slug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /api/${kind}/${slug} → ${res.status}`);
  return res.json() as Promise<PostDetail>;
}
