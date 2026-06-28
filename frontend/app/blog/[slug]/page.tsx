import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDoc } from "../../../lib/api";
import DocArticle from "../../../components/DocArticle";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDoc("posts", slug);
  if (!doc) return { title: "Not found" };
  const description = doc.summary ?? `${doc.reading_min} min read on genuine.dev`;
  return {
    title: doc.title,
    description,
    openGraph: {
      title: doc.title,
      description,
      type: "article",
      url: `https://genuine.dev/blog/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: doc.title,
      description,
    },
  };
}

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
