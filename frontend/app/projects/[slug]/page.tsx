import { notFound, redirect } from "next/navigation";
import { getDoc } from "../../../lib/api";
import { portfolioRedirectPath } from "../../../lib/projects";
import DocArticle from "../../../components/DocArticle";

export const dynamic = "force-dynamic";

export default async function Project({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const redirectTo = portfolioRedirectPath(slug);
  if (redirectTo) redirect(redirectTo);

  const doc = await getDoc("projects", slug);
  if (!doc) notFound();
  return <DocArticle doc={doc} />;
}
