import type { PostDetail } from "../lib/api";

export default function DocArticle({
  doc,
  meta = true,
}: {
  doc: PostDetail;
  meta?: boolean;
}) {
  return (
    <article>
      <h1>{doc.title}</h1>
      {meta && (
        <div className="ameta">
          <span>{doc.date ?? ""}</span>
          <span>{doc.reading_min} min read</span>
        </div>
      )}
      <div className="prose" dangerouslySetInnerHTML={{ __html: doc.body_html }} />
    </article>
  );
}
