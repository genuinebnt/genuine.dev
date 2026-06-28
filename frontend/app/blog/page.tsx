import { getPosts } from "../../lib/api";
import PostSearch from "../../components/PostSearch";

export const dynamic = "force-dynamic";

export default async function BlogIndex() {
  const posts = await getPosts();
  return (
    <>
      <div className="eyebrow">Writing</div>
      <h1 style={{ fontSize: "24px", fontWeight: 500, marginBottom: "20px" }}>All posts</h1>
      <PostSearch initialPosts={posts} />
    </>
  );
}
