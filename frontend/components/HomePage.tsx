import Link from "next/link";
import type { PostDetail, PostItem } from "../lib/api";
import { projectIsFeatured, projectTech } from "../lib/metadata";
import { deriveTopic, topicColor } from "../lib/topic";
import { parseHomeSegments } from "../lib/homePage";
import { projectAccentColor, projectCaseStudyHref } from "../lib/projects";
import { EditButton } from "./EditButton";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function FeaturedArticles({ posts }: { posts: PostItem[] }) {
  return (
    <div className="feat-grid">
      {posts.map((post) => {
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
  );
}

function FeaturedProjects({ projects }: { projects: PostItem[] }) {
  return (
    <div className="home-proj-list">
      {projects.map((proj) => {
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
  );
}

/** Landing page — CMS hero + live featured posts/projects from the API. */
export default function HomePage({
  doc,
  posts,
  projects,
}: {
  doc: PostDetail;
  posts: PostItem[];
  projects: PostItem[];
}) {
  const segments = parseHomeSegments(doc.body_html);
  const featuredPosts = posts.filter((p) => projectIsFeatured(p.metadata)).slice(0, 4);
  const featuredProjects = projects.filter((p) => projectIsFeatured(p.metadata)).slice(0, 4);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "html") {
          return (
            <div
              key={`html-${index}`}
              className={index === 0 ? "hero hero-prose" : "hero-prose"}
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          );
        }

        if (segment.kind === "articles") {
          if (featuredPosts.length === 0) return null;
          return (
            <div key="featured-articles">
              <div className="section-label">{segment.label}</div>
              <FeaturedArticles posts={featuredPosts} />
            </div>
          );
        }

        if (featuredProjects.length === 0) return null;
        return (
          <div key="featured-projects" style={{ marginTop: "40px" }}>
            <div className="section-label">{segment.label}</div>
            <FeaturedProjects projects={featuredProjects} />
          </div>
        );
      })}
      <EditButton slug={doc.slug} />
    </>
  );
}
