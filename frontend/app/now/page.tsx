import { notFound } from "next/navigation";
import { getDoc, getProjects } from "../../lib/api";
import { NowDocPage } from "../../components/NowDocPage";

export const dynamic = "force-dynamic";

export default async function Now() {
  const [doc, projects] = await Promise.all([getDoc("pages", "now"), getProjects()]);

  if (!doc) notFound();

  return <NowDocPage doc={doc} projects={projects} />;
}
