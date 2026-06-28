import { getPosts } from "../../lib/api";
import WritingIndex from "../../components/WritingIndex";

export const dynamic = "force-dynamic";

export default async function BlogIndex() {
  const posts = await getPosts();
  return <WritingIndex initialPosts={posts} />;
}
