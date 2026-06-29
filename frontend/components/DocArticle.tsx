import type { PostDetail } from "../lib/api";
import { DocInteractive } from "./DocInteractive";
import { Comments, CommentMeta, PostCommentsProvider } from "./PostComments";
import { SeriesBanner } from "./SeriesBanner";
import { EditButton } from "./EditButton";
import { ReadingProgress } from "./ReadingProgress";
import { PostTopicAccent } from "./PostTopicAccent";
import Link from "next/link";
import { deriveTopic, topicColor } from "../lib/topic";
import { postSeries, postTags } from "../lib/metadata";

// comrak renders headings as `<h2><a ... id="slug"></a>Heading text</h2>`,
// so the id lives on the inner anchor, not the heading element.
type TocLeaf = { id: string; text: string };
type TocNode = TocLeaf & { children: TocLeaf[] };

function extractTOC(html: string) {
  const matches = [...html.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/g)];
  return matches
    .map((m) => {
      const inner = m[2];
      const id = inner.match(/id="([^"]+)"/)?.[1] ?? "";
      return {
        level: parseInt(m[1]),
        id,
        text: inner.replace(/<[^>]+>/g, "").trim(),
      };
    })
    .filter((t) => t.id);
}

/** Nest h3s under their preceding h2 so the rail reads as a hierarchy, not a flat list. */
function nestTOC(flat: ReturnType<typeof extractTOC>): TocNode[] {
  const groups: TocNode[] = [];
  for (const item of flat) {
    if (item.level === 2 || groups.length === 0) {
      groups.push({ id: item.id, text: item.text, children: [] });
    } else {
      groups[groups.length - 1].children.push({ id: item.id, text: item.text });
    }
  }
  return groups;
}

export default function DocArticle({
  doc,
  meta = true,
}: {
  doc: PostDetail;
  meta?: boolean;
}) {
  const toc = extractTOC(doc.body_html);
  const hasToc = meta && toc.length > 0;

  const topic = deriveTopic(doc.metadata);
  const topicClr = topicColor(topic);
  const tags = postTags(doc.metadata);
  const series = postSeries(doc.metadata);
  const eyebrow = [topic, ...tags.filter((t) => t !== topic)].filter(Boolean).join(" · ");

  if (!meta) {
    // Solo layout for CMS-backed project pages (no post TOC sidebar).
    return (
      <>
        <ReadingProgress targetId="reading-target" />
        <div className="article-solo">
          <article id="reading-target" className="article">
          {series && (
            <SeriesBanner series={series} prev={doc.series_prev} next={doc.series_next} />
          )}
          <h1 className="art-h1" style={{ fontSize: "32px", lineHeight: 1.15, marginBottom: "16px" }}>
            {doc.title}
          </h1>
          <div className="prose" dangerouslySetInnerHTML={{ __html: doc.body_html }} />
        </article>
        <DocInteractive />
        </div>
        <EditButton slug={doc.slug} />
      </>
    );
  }

  return (
    <>
      <PostTopicAccent topic={topic} />
      <ReadingProgress targetId="reading-target" />
      <div className={hasToc ? "post-shell" : "article-solo"}>
      {/* Left: TOC + meta kv */}
      {hasToc && (
        <div className="toc-col">
          <div className="toc-head">On this page</div>
          <nav className="toc-nav">
            {nestTOC(toc).map((node) => (
              <div className="toc-group" key={node.id}>
                <a href={`#${node.id}`} className="toc-link">
                  {node.text}
                </a>
                {node.children.length > 0 && (
                  <div className="toc-children">
                    {node.children.map((child) => (
                      <a key={child.id} href={`#${child.id}`} className="toc-link toc-sub">
                        {child.text}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <hr className="toc-divider" />

          {doc.date && (
            <div className="toc-kv">
              <div className="toc-kv-label">Date</div>
              <div className="toc-kv-val">{doc.date}</div>
            </div>
          )}
          <div className="toc-kv">
            <div className="toc-kv-label">Read</div>
            <div className="toc-kv-val">{doc.reading_min} min</div>
          </div>
          {topic && (
            <div className="toc-kv">
              <div className="toc-kv-label">Topic</div>
              <div className="toc-kv-val" style={{ color: topicClr }}>{topic}</div>
            </div>
          )}
          {tags.length > 0 && (
            <div className="toc-kv">
              <div className="toc-kv-label">Tags</div>
              <div className="toc-tags">
                {tags.map((tag) => (
                  <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="toc-tag">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right: article body */}
      <div id="reading-target" className="article-col" data-scroll-root>
        {series && (
          <SeriesBanner series={series} prev={doc.series_prev} next={doc.series_next} />
        )}

        {eyebrow && <div className="art-eyebrow">{eyebrow}</div>}

        <h1 className="art-h1">{doc.title}</h1>

        <PostCommentsProvider slug={doc.slug}>
          <div className="art-meta">
            {doc.date && <span>{doc.date}</span>}
            <span>{doc.reading_min} min read</span>
            <CommentMeta />
            {topic && (
              <span
                className="art-topic-pill"
                style={{
                  background: `color-mix(in srgb, ${topicClr} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${topicClr} 30%, transparent)`,
                  color: topicClr,
                }}
              >
                {topic}
              </span>
            )}
          </div>

          {doc.cover_image && (
            <div
              className="read-measure"
              style={{ marginBottom: "24px", borderRadius: "var(--radius)", overflow: "hidden" }}
            >
              <img src={doc.cover_image} alt="Cover" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          )}

          <div className="prose" dangerouslySetInnerHTML={{ __html: doc.body_html }} />

          {doc.related && doc.related.length > 0 && (
            <section className="related-posts" aria-label="Related posts">
              <div className="related-posts-h">Related</div>
              <div className="related-posts-list">
                {doc.related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="related-post-card">
                    <span className="related-post-title">{r.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="art-prevnext">
            {doc.prev ? (
              <Link href={`/blog/${doc.prev.slug}`} className="art-pn">
                <div className="art-pn-dir">← prev</div>
                <div className="art-pn-title">{doc.prev.title}</div>
              </Link>
            ) : (
              <Link href="/blog" className="art-pn">
                <div className="art-pn-dir">← index</div>
                <div className="art-pn-title">Back to articles</div>
              </Link>
            )}
            {doc.next && (
              <Link href={`/blog/${doc.next.slug}`} className="art-pn art-pn-right">
                <div className="art-pn-dir">next →</div>
                <div className="art-pn-title">{doc.next.title}</div>
              </Link>
            )}
          </div>

          <Comments />
        </PostCommentsProvider>
      </div>
      </div>

      <DocInteractive />
      <EditButton slug={doc.slug} />
    </>
  );
}
