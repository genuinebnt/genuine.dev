"use client";

import type { PostDetail, PostItem } from "../lib/api";
import { docMetadata } from "../lib/metadata";
import {
  PORTFOLIO_SLUGS,
  projectAccentColor,
  projectCaseStudyHref,
  projectStatusFromMetadata,
} from "../lib/projects";
import { splitNowBody } from "../lib/pageToc";
import ProjectCard from "./ProjectCard";
import { PanelDocPage } from "./PanelDocPage";

function portfolioProjects(projects: PostItem[]): PostItem[] {
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  return PORTFOLIO_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (p): p is PostItem => p != null,
  );
}

function NowPortfolioBlock({ projects }: { projects: PostItem[] }) {
  const portfolio = portfolioProjects(projects);

  return (
    <div className="now-portfolio-block">
      <div className="projects-list">
        {portfolio.map((project) => {
          const metadata = docMetadata(project);
          return (
            <ProjectCard
              key={project.slug}
              href={projectCaseStudyHref(project.slug)}
              name={project.title.split(" — ")[0] ?? project.title}
              description={project.summary ?? ""}
              accentColor={projectAccentColor(project.slug) ?? "var(--acc)"}
              status={projectStatusFromMetadata(metadata)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** `/now` — CMS prose + live portfolio cards from the projects API. */
export function NowDocPage({ doc, projects }: { doc: PostDetail; projects: PostItem[] }) {
  const { before, after } = splitNowBody(doc.body_html);
  const lastUpdated = docMetadata(doc).last_updated as string | undefined;

  return (
    <PanelDocPage
      doc={doc}
      shell="now-shell"
      scrollRootId="now-scroll-root"
      tocLabel="On this page"
      lastUpdated={lastUpdated}
      bodyBefore={before}
      bodyAfter={after}
      bodyExtra={<NowPortfolioBlock projects={projects} />}
    />
  );
}
