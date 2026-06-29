import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "../../../lib/api";
import { postsForTag } from "../../../lib/tags";
import { deriveTopic, topicColor } from "../../../lib/topic";
import { PageHeader } from "../../../components/ui/PageHeader";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = decodeURIComponent(slug);
  return { title: `#${tag}`, description: `Posts tagged ${tag}.` };
}

export default async function TagDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = decodeURIComponent(slug);
  const posts = await getPosts();
  const tagged = postsForTag(posts, tag);
  if (tagged.length === 0) notFound();

  return (
    <div className="series-page">
      <PageHeader eyebrow="Tag" title={`#${tag}`} />

      <div className="series-detail-meta">
        <span>
          {tagged.length} {tagged.length === 1 ? "post" : "posts"}
        </span>
      </div>

      <ul className="series-parts">
        {tagged.map((post) => {
          const topic = deriveTopic(post.metadata);
          const color = topicColor(topic);
          return (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="series-part">
                <span className="series-part-bar" style={{ background: color }} aria-hidden />
                {topic && (
                  <span className="series-part-num" style={{ color }}>
                    {topic}
                  </span>
                )}
                <span className="series-part-body">
                  <span className="series-part-title">{post.title}</span>
                  {post.summary && <span className="series-part-summary">{post.summary}</span>}
                </span>
                <span className="series-part-read">
                  {post.date ? `${post.date} · ` : ""}
                  {post.reading_min} min
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="series-back-row">
        <Link href="/tags" className="series-back">
          ← all tags
        </Link>
        <Link href="/blog" className="series-back">
          all articles →
        </Link>
      </div>
    </div>
  );
}
