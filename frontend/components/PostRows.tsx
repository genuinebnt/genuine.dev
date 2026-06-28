import Link from "next/link";
import type { PostItem } from "../lib/api";

export default function PostRows({ posts }: { posts: PostItem[] }) {
  if (posts.length === 0) return <p className="muted">No posts found.</p>;
  return (
    <div className="post-list">
      {posts.map((p) => (
        <Link key={p.slug} className="post-row" href={`/blog/${p.slug}`}>
          <span className="date">{p.date ?? ""}</span>
          <div>
            <div className="post-title">{p.title}</div>
            <span className="meta">{p.reading_min} min read</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
