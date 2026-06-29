import type { PostItem } from "./api";
import { postSeries } from "./metadata";
import { deriveTopic } from "./topic";

/** URL-safe slug for a series name (used for `/series/:slug`). */
export function seriesSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type SeriesPart = {
  slug: string;
  title: string;
  summary: string | null;
  reading_min: number;
  date: string | null;
  part: number;
};

export type Series = {
  name: string;
  slug: string;
  topic: string;
  parts: SeriesPart[];
};

/** Group published posts into series by `metadata.series.name`, parts ordered ascending. */
export function groupSeries(posts: PostItem[]): Series[] {
  const map = new Map<string, Series>();
  for (const post of posts) {
    const meta = postSeries(post.metadata);
    if (!meta) continue;
    const slug = seriesSlug(meta.name);
    let entry = map.get(slug);
    if (!entry) {
      entry = { name: meta.name, slug, topic: deriveTopic(post.metadata), parts: [] };
      map.set(slug, entry);
    }
    entry.parts.push({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      reading_min: post.reading_min,
      date: post.date,
      part: meta.part,
    });
  }

  const list = [...map.values()];
  for (const series of list) series.parts.sort((a, b) => a.part - b.part);
  list.sort((a, b) => b.parts.length - a.parts.length || a.name.localeCompare(b.name));
  return list;
}

export function findSeries(posts: PostItem[], slug: string): Series | undefined {
  return groupSeries(posts).find((series) => series.slug === slug);
}

export function totalReadingMin(series: Series): number {
  return series.parts.reduce((sum, part) => sum + part.reading_min, 0);
}
