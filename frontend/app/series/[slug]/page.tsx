import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "../../../lib/api";
import { findSeries, totalReadingMin } from "../../../lib/series";
import { topicColor } from "../../../lib/topic";
import { PageHeader } from "../../../components/ui/PageHeader";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const series = findSeries(await getPosts(), slug);
  if (!series) return { title: "Series not found" };
  return {
    title: series.name,
    description: `A ${series.parts.length}-part series.`,
  };
}

export default async function SeriesDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getPosts();
  const series = findSeries(posts, slug);
  if (!series) notFound();

  const color = topicColor(series.topic);

  return (
    <div className="series-page">
      <PageHeader eyebrow="Series" title={series.name} />

      <div className="series-detail-meta">
        {series.topic && <span style={{ color }}>{series.topic}</span>}
        <span>{series.parts.length} parts</span>
        <span>{totalReadingMin(series)} min total</span>
      </div>

      <ol className="series-parts">
        {series.parts.map((part) => (
          <li key={part.slug}>
            <Link href={`/blog/${part.slug}`} className="series-part">
              <span className="series-part-bar" style={{ background: color }} aria-hidden />
              <span className="series-part-num">Part {part.part}</span>
              <span className="series-part-body">
                <span className="series-part-title">{part.title}</span>
                {part.summary && <span className="series-part-summary">{part.summary}</span>}
              </span>
              <span className="series-part-read">{part.reading_min} min</span>
            </Link>
          </li>
        ))}
      </ol>

      <Link href="/blog" className="series-back">
        ← all articles
      </Link>
    </div>
  );
}
