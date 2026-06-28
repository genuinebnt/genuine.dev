import { notFound } from "next/navigation";
import { getDoc } from "../../lib/api";
import DocArticle from "../../components/DocArticle";

export const dynamic = "force-dynamic";

export default async function About() {
  const doc = await getDoc("pages", "about");
  if (!doc) notFound();
  return <DocArticle doc={doc} meta={false} />;
}
