import { getPosts, getProjects } from "../lib/api";
import { projectIsFeatured, projectTech } from "../lib/metadata";
import { deriveTopic, topicColor } from "../lib/topic";
import Link from "next/link";
import { projectAccentColor, projectCaseStudyHref } from "../lib/projects";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default async function Home() {
  const posts = await getPosts();
  const projects = await getProjects();

  const featuredPosts = posts.filter((p) => projectIsFeatured(p.metadata)).slice(0, 4);
  const featuredProjects = projects.filter((p) => projectIsFeatured(p.metadata)).slice(0, 4);

  return (
    <>
      <div className="hero">
      <div className="eyebrow">Rust · Systems · Infosec</div>
      <h1>
        I build <span>systems</span> and write about how they break.
      </h1>
      <p className="lead">
        Backend &amp; distributed systems engineer working mostly in Rust. I write deep
        technical posts on systems programming, distributed systems, and offensive/defensive
        security.
      </p>
      <div className="meta-row">
        <span className="meta-pill">
          <strong>Focus</strong> Rust
        </span>
        <span className="meta-pill">
          <strong>Writing</strong> coding · infosec
        </span>
        <span className="meta-pill">
          <strong>Bug bounty</strong> active
        </span>
        <span className="meta-pill">
          <strong>Stack</strong> axum · postgres
        </span>
      </div>

      <div className="divider5">
        <div style={{ background: "var(--warn)" }} />
        <div style={{ background: "var(--purple)" }} />
        <div style={{ background: "var(--blue)" }} />
        <div style={{ background: "var(--acc)" }} />
        <div style={{ background: "var(--faint)" }} />
      </div>
      </div>{/* end .hero */}

      {featuredPosts.length > 0 && (
        <>
          <div className="section-label">featured articles</div>
          <div className="feat-grid">
            {featuredPosts.map((post) => {
              const topic = deriveTopic(post.metadata as Record<string, unknown> | undefined);
              const color = topicColor(topic);
              const tags = (post.metadata?.tags as string[] | undefined) ?? [];
              return (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="feat-card">
                  <div className="fc-bar" style={{ background: color }} />
                  <div className="fc-body">
                    <span className="fc-tag" style={{ color }}>
                      {topic || tags[0] || "post"}
                    </span>
                    <div className="fc-title">{post.title}</div>
                    <div className="fc-summary">{post.summary}</div>
                    <div className="fc-meta">
                      <span>{formatDate(post.date)}</span>
                      <span>{post.reading_min} min</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {featuredProjects.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: "40px" }}>
            selected projects
          </div>
          <div className="home-proj-list">
            {featuredProjects.map((proj) => {
              const topic = deriveTopic(proj.metadata as Record<string, unknown> | undefined);
              const color = projectAccentColor(proj.slug) ?? topicColor(topic);
              const tech = projectTech(proj.metadata);
              return (
                <Link key={proj.slug} href={projectCaseStudyHref(proj.slug)} className="home-proj-row">
                  <div className="hpr-bar" style={{ background: color }} />
                  <div className="hpr-content">
                    <div className="hpr-info">
                      <div className="hpr-name">{proj.title}</div>
                      <div className="hpr-desc">{proj.summary}</div>
                      {tech.length > 0 && (
                        <div className="hpr-stack">
                          {tech.map((t) => (
                            <span key={t} className="hpr-chip">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="hpr-link">case study →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
