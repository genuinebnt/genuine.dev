"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PostItem } from "../lib/api";
import { docMetadata, projectBrowseUrl, projectGithub, projectTech } from "../lib/metadata";
import { deriveTopic, topicColor } from "../lib/topic";
import { RailToggle } from "./ui/RailToggle";
import {
  PROJECTS_PAGE_SIZE,
  clampPage,
  paginateSlice,
  parsePageParam,
  writePageQuery,
} from "../lib/pagination";
import {
  projectAccentColor,
  projectCaseStudyHref,
  projectStatusFromMetadata,
} from "../lib/projects";
import ProjectCard from "./ProjectCard";
import Pagination from "./ui/Pagination";

interface Props {
  projects: PostItem[];
}

function summarizeFilters(projects: PostItem[]) {
  const stacks = new Set<string>();
  const stackCounts: Record<string, number> = {};
  let complete = 0;
  let wip = 0;

  for (const project of projects) {
    const metadata = docMetadata(project);
    const status = projectStatusFromMetadata(metadata);
    if (status === "complete") complete++;
    else if (status === "wip") wip++;

    for (const tech of projectTech(metadata)) {
      const key = tech.toLowerCase();
      stacks.add(key);
      stackCounts[key] = (stackCounts[key] ?? 0) + 1;
    }
  }

  return {
    allStacks: Array.from(stacks).sort(),
    stackCounts,
    statusCounts: { complete, wip },
  };
}

export default function ProjectsShell({ projects }: Props) {
  const searchParams = useSearchParams();
  const [activeStack, setActiveStack] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const skipFilterReset = useRef(true);
  const { allStacks, stackCounts, statusCounts } = useMemo(
    () => summarizeFilters(projects),
    [projects],
  );

  const filtered = projects.filter((project) => {
    const metadata = docMetadata(project);
    if (activeStack) {
      const tech = projectTech(metadata).map((t) => t.toLowerCase());
      if (!tech.includes(activeStack)) return false;
    }
    if (activeStatus) {
      const status = projectStatusFromMetadata(metadata);
      if (activeStatus === "complete" && status !== "complete") return false;
      if (activeStatus === "wip" && status !== "wip") return false;
    }
    return true;
  });

  useEffect(() => {
    if (skipFilterReset.current) {
      skipFilterReset.current = false;
      return;
    }
    writePageQuery(1);
  }, [activeStack, activeStatus]);

  const page = parsePageParam(searchParams.get("page"));

  const pageProjects = useMemo(
    () => paginateSlice(filtered, page, PROJECTS_PAGE_SIZE),
    [filtered, page],
  );

  function goToPage(next: number) {
    const clamped = clampPage(next, filtered.length, PROJECTS_PAGE_SIZE);
    writePageQuery(clamped);
  }

  return (
    <div className="projects-shell" data-rail-shell>
      <div className="proj-filter">
        <RailToggle storageKey="rail-projects" label="filters" />
        <div className="pf-header">
          <div className="pf-eyebrow">Projects</div>
          <div className="pf-title">Things I&apos;ve built</div>
        </div>

        <div className="pf-section">
          <div className="pf-h">stack</div>
          <div
            className={`pf-item${!activeStack && !activeStatus ? " pf-sel" : ""}`}
            onClick={() => {
              setActiveStack(null);
              setActiveStatus(null);
            }}
          >
            <span className="pf-dot pf-dot-muted" />
            <span className="pf-label">all</span>
            <span className="pf-count">{projects.length}</span>
          </div>
          {allStacks.map((stack) => (
            <div
              key={stack}
              className={`pf-item${activeStack === stack ? " pf-sel" : ""}`}
              onClick={() => setActiveStack(activeStack === stack ? null : stack)}
            >
              <span
                className="pf-dot"
                style={{ background: topicColor(stack) }}
              />
              <span className="pf-label">{stack}</span>
              <span className="pf-count">{stackCounts[stack] ?? 0}</span>
            </div>
          ))}
        </div>

        <div className="pf-section">
          <div className="pf-h">status</div>
          <div
            className={`pf-item${activeStatus === "complete" ? " pf-sel" : ""}`}
            onClick={() =>
              setActiveStatus(activeStatus === "complete" ? null : "complete")
            }
          >
            <span className="pf-dot pf-dot-complete" />
            <span className="pf-label">complete</span>
            <span className="pf-count">{statusCounts.complete}</span>
          </div>
          <div
            className={`pf-item${activeStatus === "wip" ? " pf-sel" : ""}`}
            onClick={() => setActiveStatus(activeStatus === "wip" ? null : "wip")}
          >
            <span className="pf-dot pf-dot-wip" />
            <span className="pf-label">in progress</span>
            <span className="pf-count">{statusCounts.wip}</span>
          </div>
        </div>
      </div>

      <div className="projects-body">
        <div className="projects-scroll">
          <div className="projects-list">
            {pageProjects.map((project) => {
              const metadata = docMetadata(project);
              const topic = deriveTopic(metadata);
              return (
                <ProjectCard
                  key={project.slug}
                  href={projectCaseStudyHref(project.slug)}
                  name={project.title}
                  description={project.summary ?? ""}
                  accentColor={projectAccentColor(project.slug) ?? topicColor(topic)}
                  status={projectStatusFromMetadata(metadata)}
                  tech={projectTech(metadata)}
                  github={projectGithub(metadata)}
                  browse={projectBrowseUrl(metadata)}
                />
              );
            })}
            {filtered.length === 0 && (
              <p className="projects-empty">No projects match the filter.</p>
            )}
          </div>
        </div>
        <Pagination
          className="proj-pagination"
          page={page}
          totalItems={filtered.length}
          pageSize={PROJECTS_PAGE_SIZE}
          onPageChange={goToPage}
        />
      </div>
    </div>
  );
}
