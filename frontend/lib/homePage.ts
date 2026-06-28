const FEATURED_SLOT =
  /<div class="home-featured-slot" data-slot="(articles|projects)"(?: data-label="([^"]*)")?[^>]*><\/div>/g;

export type HomeSegment =
  | { kind: "html"; html: string }
  | { kind: "articles"; label: string }
  | { kind: "projects"; label: string };

/** Split landing-page HTML into static CMS blocks and featured-list injection points. */
export function parseHomeSegments(html: string): HomeSegment[] {
  const segments: HomeSegment[] = [];
  let lastIndex = 0;

  for (const match of html.matchAll(FEATURED_SLOT)) {
    if (match.index === undefined) continue;

    const before = html.slice(lastIndex, match.index).trim();
    if (before) segments.push({ kind: "html", html: before });

    const slot = match[1] as "articles" | "projects";
    const label =
      match[2] ??
      (slot === "articles" ? "featured articles" : "selected projects");
    segments.push({ kind: slot, label });

    lastIndex = match.index + match[0].length;
  }

  const tail = html.slice(lastIndex).trim();
  if (tail) segments.push({ kind: "html", html: tail });

  return segments;
}
