import Link from "next/link";
import type { PostNavItem } from "../lib/api";

type SeriesMeta = { name: string; part: number };

export function SeriesBanner({
  series,
  prev,
  next,
}: {
  series: SeriesMeta;
  prev?: PostNavItem | null;
  next?: PostNavItem | null;
}) {
  if (!series) return null;

  return (
    <div className="series-banner">
      <div className="series-banner-main">
        <span className="series-banner-label">Series</span>
        <span>
          Part {series.part} of <strong>{series.name}</strong>
        </span>
      </div>
      {(prev || next) && (
        <div className="series-banner-nav">
          {prev ? (
            <Link href={`/blog/${prev.slug}`} className="series-banner-link">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/blog/${next.slug}`} className="series-banner-link series-banner-link-next">
              {next.title} →
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
