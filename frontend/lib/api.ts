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
  metadata?: Record<string, unknown>;
};

export type PostNavItem = { slug: string; title: string };

export type PostDetail = PostItem & { 
  body_html: string; 
  kind: string; 
  cover_image: string | null;
  prev: PostNavItem | null;
  next: PostNavItem | null;
  related?: PostNavItem[];
  series_prev?: PostNavItem | null;
  series_next?: PostNavItem | null;
};

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

export type CommentOut = {
  id: string;
  name: string;
  body: string;
  date: string;
};

export const getComments = (slug: string) => 
  get<CommentOut[]>(`/api/posts/${slug}/comments`);

export async function submitComment(slug: string, name: string, body: string): Promise<CommentOut> {
  const res = await fetch(`${API}/api/posts/${slug}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, body })
  });
  if (!res.ok) throw new Error(`POST /api/posts/${slug}/comments → ${res.status}`);
  return res.json();
}
