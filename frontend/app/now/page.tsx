import { notFound } from "next/navigation";
import { getDoc } from "../../lib/api";
import { NowDocPage } from "../../components/NowDocPage";

export const dynamic = "force-dynamic";

export default async function Now() {
  const doc = await getDoc("pages", "now");

  if (!doc) notFound();

  return <NowDocPage doc={doc} />;
}
