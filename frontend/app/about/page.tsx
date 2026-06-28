import { notFound } from "next/navigation";
import { getDoc } from "../../lib/api";
import AboutShell from "../../components/AboutShell";

export const dynamic = "force-dynamic";

export default async function About() {
  const doc = await getDoc("pages", "about");
  if (!doc) notFound();
  return <AboutShell doc={doc} />;
}
