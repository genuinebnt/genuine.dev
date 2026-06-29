import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "../../lib/api";
import { groupSeries, totalReadingMin } from "../../lib/series";
import { topicColor } from "../../lib/topic";
import { PageHeader } from "../../components/ui/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Series",
  description: "Multi-part deep dives, grouped and ordered.",
};

export default async function SeriesIndex() {
  const posts = await getPosts();
  const series = groupSeries(posts);

  return (
    <div className="series-page">
      <PageHeader eyebrow="Series" title="Multi-part deep dives" />

      {series.length === 0 ? (
        <p className="muted">No series yet.</p>
      ) : (
        <div className="series-grid">
          {series.map((s) => {
            const color = topicColor(s.topic);
            return (
              <Link key={s.slug} href={`/series/${s.slug}`} className="series-card">
                <span className="series-card-bar" style={{ background: color }} aria-hidden />
                <div className="series-card-body">
                  <div className="series-card-name">{s.name}</div>
                  <div className="series-card-meta">
                    {s.topic && <span style={{ color }}>{s.topic}</span>}
                    <span>{s.parts.length} parts</span>
                    <span>{totalReadingMin(s)} min</span>
                  </div>
                  {s.parts[0]?.summary && (
                    <div className="series-card-summary">{s.parts[0].summary}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
