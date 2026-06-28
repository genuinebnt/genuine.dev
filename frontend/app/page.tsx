import { notFound } from "next/navigation";
import { getDoc, getPosts, getProjects } from "../lib/api";
import HomePage from "../components/HomePage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [doc, posts, projects] = await Promise.all([
    getDoc("pages", "home"),
    getPosts(),
    getProjects(),
  ]);

  if (!doc) notFound();

  return <HomePage doc={doc} posts={posts} projects={projects} />;
}
