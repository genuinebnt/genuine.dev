/** Sidebar sections for panel pages backed by CMS HTML. */
export type PanelSection = { id: string; label: string };

/** Extract TOC entries from rendered uses-section and now-style headings. */
export function extractPanelSections(html: string): PanelSection[] {
  const sections: PanelSection[] = [];

  for (const m of html.matchAll(
    /<div id="([^"]+)"[^>]*>[\s\S]*?<h2 class="uses-h2"[^>]*>[\s\S]*?<\/div>([^<]+)<\/h2>/g,
  )) {
    sections.push({ id: m[1], label: m[2].trim() });
  }

  for (const m of html.matchAll(/<h2 id="([^"]+)"[^>]*>(?:<a[^>]*><\/a>)?([^<]+)/g)) {
    if (sections.some((s) => s.id === m[1])) continue;
    sections.push({ id: m[1], label: m[2].trim() });
  }

  return sections;
}

const PORTFOLIO_SLOT = /<div class="now-portfolio-slot">[\s\S]*?<\/div>/;

/** Split `/now` body around the live portfolio project injection point. */
export function splitNowBody(html: string): { before: string; after: string } {
  const match = html.match(PORTFOLIO_SLOT);
  if (!match || match.index === undefined) {
    return { before: html, after: "" };
  }
  return {
    before: html.slice(0, match.index),
    after: html.slice(match.index + match[0].length),
  };
}
