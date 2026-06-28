import { getPosts } from "../lib/api";
import PostSearch from "../components/PostSearch";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPosts();
  return (
    <>
      <p className="eyebrow">Rust · Systems · Infosec</p>
      <h1>
        I build systems and write about how they <span>break</span>.
      </h1>
      <p className="lead">
        Backend &amp; distributed-systems engineer working mostly in Rust. Notes on
        systems programming, distributed systems, and offensive/defensive security.
      </p>
      <div className="section-label">writing</div>
      <PostSearch initialPosts={posts} />
    </>
  );
}
