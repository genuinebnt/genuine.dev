import { getPosts, getProjects } from "../lib/api";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPosts();
  const projects = await getProjects();

  const featuredPosts = posts.filter(p => p.metadata?.featured).slice(0, 3);
  const featuredProjects = projects.filter(p => p.metadata?.featured).slice(0, 3);

  return (
    <>
      <div className="hero">
        <div className="eyebrow">Rust · Systems · Infosec</div>
        <h1>
          I build <span>systems</span> and write about how they break.
        </h1>
        <p className="lead">
          Backend &amp; distributed systems engineer working mostly in Rust. I write
          deep technical posts on systems programming, distributed systems, and
          offensive/defensive security.
        </p>
        <div className="meta-row">
          <span className="meta-pill"><strong>Focus</strong> Rust</span>
          <span className="meta-pill"><strong>Writing</strong> coding · infosec</span>
          <span className="meta-pill"><strong>Bug bounty</strong> active</span>
          <span className="meta-pill"><strong>Stack</strong> axum · postgres</span>
        </div>
      </div>
      
      <div className="divider5">
        <div style={{ background: "var(--warn)" }}></div>
        <div style={{ background: "var(--purple)" }}></div>
        <div style={{ background: "var(--blue)" }}></div>
        <div style={{ background: "var(--acc)" }}></div>
        <div style={{ background: "var(--faint)" }}></div>
      </div>

      {featuredPosts.length > 0 && (
        <>
          <div className="section-label">featured writing</div>
          <div className="card-grid">
            {featuredPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="pcard">
                <span className="ptag">{post.metadata?.series ? 'series' : 'post'}</span>
                <h3>{post.title}</h3>
                <p>{post.summary}</p>
                <div className="pmeta">
                  <span>{post.date}</span>
                  <span>{post.reading_min} min</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {featuredProjects.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: "40px" }}>selected projects</div>
          <div className="card-grid">
            {featuredProjects.map((proj) => (
              <Link key={proj.slug} href={`/projects/${proj.slug}`} className="proj">
                <h3>{proj.title}</h3>
                <div className="pd">{proj.summary}</div>
                <div className="tstack">
                  {(proj.metadata?.tech || []).map((t: string) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
                <div className="links">
                  <span>case study &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
