import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "../../lib/api";
import { allTags } from "../../lib/tags";
import { PageHeader } from "../../components/ui/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tags",
  description: "Browse posts by tag.",
};

export default async function TagsIndex() {
  const posts = await getPosts();
  const tags = allTags(posts);

  return (
    <div className="series-page">
      <PageHeader eyebrow="Tags" title="Browse by tag" />

      {tags.length === 0 ? (
        <p className="muted">No tags yet.</p>
      ) : (
        <div className="tag-cloud">
          {tags.map(({ tag, count }) => (
            <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag-chip">
              <span className="tag-chip-name">{tag}</span>
              <span className="tag-chip-count">{count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
