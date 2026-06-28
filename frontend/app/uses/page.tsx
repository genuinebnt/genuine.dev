import { notFound } from "next/navigation";
import { getDoc } from "../../lib/api";
import { PanelDocPage } from "../../components/PanelDocPage";

export const dynamic = "force-dynamic";

export default async function Uses() {
  const doc = await getDoc("pages", "uses");
  if (!doc) notFound();

  return (
    <PanelDocPage
      doc={doc}
      shell="uses-shell"
      scrollRootId="uses-scroll-root"
      tocLabel="sections"
      bodyHtml={doc.body_html}
    />
  );
}
