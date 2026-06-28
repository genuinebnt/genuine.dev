import { notFound } from "next/navigation";
import { getDoc } from "../../lib/api";
import AboutDocPage from "../../components/AboutDocPage";

export const dynamic = "force-dynamic";

export default async function About() {
  const doc = await getDoc("pages", "about");
  if (!doc) notFound();
  return <AboutDocPage doc={doc} />;
}
