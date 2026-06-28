import Link from "next/link";
import type { PostItem } from "../lib/api";

export default function PostRows({ posts }: { posts: PostItem[] }) {
  if (posts.length === 0) return <p style={{ color: "var(--muted)" }}>No posts found.</p>;
  return (
    <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
      {posts.map((p) => (
        <Link key={p.slug} className="pcard" href={`/blog/${p.slug}`}>
          <span className="ptag">{p.metadata?.series ? 'series' : 'post'}</span>
          <h3>{p.title}</h3>
          <p>{p.summary}</p>
          <div className="pmeta">
            <span>{p.date}</span>
            <span>{p.reading_min} min</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
