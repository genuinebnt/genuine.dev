import { notFound } from "next/navigation";
import { getDoc } from "../../../lib/api";
import DocArticle from "../../../components/DocArticle";

export const dynamic = "force-dynamic";

export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getDoc("posts", slug);
  if (!doc) notFound();
  return <DocArticle doc={doc} />;
}
