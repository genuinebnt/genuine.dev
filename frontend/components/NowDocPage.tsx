"use client";

import type { PostDetail } from "../lib/api";
import { docMetadata } from "../lib/metadata";
import { PanelDocPage } from "./PanelDocPage";

/** `/now` — CMS prose with now-* directives (status cards, roadmap bars, chips, reading). */
export function NowDocPage({ doc }: { doc: PostDetail }) {
  const lastUpdated = docMetadata(doc).last_updated as string | undefined;

  return (
    <PanelDocPage
      doc={doc}
      shell="now-shell"
      scrollRootId="now-scroll-root"
      tocLabel="On this page"
      lastUpdated={lastUpdated}
      bodyHtml={doc.body_html}
    />
  );
}
