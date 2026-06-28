import { Suspense } from "react";
import { getPosts } from "../../lib/api";
import WritingIndex from "../../components/WritingIndex";

export const dynamic = "force-dynamic";

export default async function BlogIndex() {
  const posts = await getPosts();
  return (
    <Suspense fallback={<div className="wri-shell"><p className="muted" style={{ padding: 24 }}>Loading…</p></div>}>
      <WritingIndex initialPosts={posts} />
    </Suspense>
  );
}
