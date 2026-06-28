/** Sidebar sections for panel pages backed by CMS HTML. */
export type PanelSection = { id: string; label: string; level?: 2 | 3 };

/** Extract TOC entries from rendered uses-section, h2, and h3 headings. */
export function extractPanelSections(html: string): PanelSection[] {
  const sections: PanelSection[] = [];
  const seen = new Set<string>();

  function push(id: string, label: string, level: 2 | 3) {
    if (seen.has(id)) return;
    seen.add(id);
    sections.push({ id, label, level });
  }

  for (const m of html.matchAll(
    /<div id="([^"]+)"[^>]*>[\s\S]*?<h2 class="uses-h2"[^>]*>[\s\S]*?<\/div>([^<]+)<\/h2>/g,
  )) {
    push(m[1], m[2].trim(), 2);
  }

  for (const m of html.matchAll(/<h2 id="([^"]+)"[^>]*>(?:<a[^>]*><\/a>)?([^<]+)/g)) {
    push(m[1], m[2].trim(), 2);
  }

  for (const m of html.matchAll(/<h3 id="([^"]+)"[^>]*>(?:<a[^>]*><\/a>)?([^<]+)/g)) {
    push(m[1], m[2].trim(), 3);
  }

  // Comrak: id lives on the inner anchor, not the heading element.
  for (const m of html.matchAll(/<h([23])>\s*<a[^>]*\bid="([^"]+)"[^>]*>\s*<\/a>\s*([^<]+)\s*<\/h\1>/g)) {
    push(m[2], m[3].trim(), m[1] === "2" ? 2 : 3);
  }

  return sections;
}

