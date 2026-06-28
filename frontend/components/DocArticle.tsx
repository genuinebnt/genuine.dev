import type { PostDetail } from "../lib/api";
import { DocInteractive } from "./DocInteractive";
import { Comments } from "./Comments";
import { SeriesBanner } from "./SeriesBanner";
import { EditButton } from "./EditButton";
import Link from "next/link";

// comrak renders headings as `<h2><a ... id="slug"></a>Heading text</h2>`,
// so the id lives on the inner anchor, not the heading element.
function extractTOC(html: string) {
  const matches = [...html.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/g)];
  return matches
    .map(m => {
      const inner = m[2];
      const id = inner.match(/id="([^"]+)"/)?.[1] ?? "";
      return {
        level: parseInt(m[1]),
        id,
        text: inner.replace(/<[^>]+>/g, "").trim(), // strip inner HTML tags
      };
    })
    .filter(t => t.id);
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

  return (
    <div className={hasToc ? "article-layout" : "article-solo"}>
      {hasToc && (
        <div className="toc">
          <div className="toc-h">On this page</div>
          {toc.map(t => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={t.level === 3 ? "sub" : ""}
            >
              {t.text}
            </a>
          ))}
        </div>
      )}

      <article className="article">
        {doc.metadata?.series && (
          <SeriesBanner series={doc.metadata.series} />
        )}
        
        <h1 style={{ fontSize: "32px", fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "16px" }}>
          {doc.title}
        </h1>
        
        {meta && (
          <div className="ameta" style={{ marginBottom: "36px", display: "flex", gap: "10px", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--faint)" }}>
            <span>{doc.date ?? ""}</span>
            <span>{doc.reading_min} min read</span>
            {doc.metadata?.tags && (
              <span style={{ color: "var(--acc)" }}>
                {doc.metadata.tags.join(" · ")}
              </span>
            )}
          </div>
        )}
        
        {doc.cover_image && (
          <div style={{ marginBottom: "36px", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <img src={doc.cover_image} alt="Cover" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        )}
        
        <div className="prose" dangerouslySetInnerHTML={{ __html: doc.body_html }} />
        
        {meta && (
          <div className="prevnext">
            {/* Hardcoded for now since backend doesn't provide prev/next yet */}
            <Link href="/blog" className="pn-card">
              <div className="dir">← INDEX</div>
              <div className="t">Back to writing</div>
            </Link>
          </div>
        )}
        
        {meta && (
          <Comments slug={doc.slug} />
        )}
      </article>

      <DocInteractive />
      <EditButton slug={doc.slug} />
    </div>
  );
}
