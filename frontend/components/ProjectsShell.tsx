"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PostItem } from "../lib/api";
import { docMetadata, projectBrowseUrl, projectGithub, projectTech } from "../lib/metadata";
import { deriveTopic, topicColor } from "../lib/topic";
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
import ListTableHead from "./ui/ListTableHead";
import { PageHeader } from "./ui/PageHeader";

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
  const router = useRouter();
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

  const statusCards = [
    { key: null as string | null, label: "all projects", count: projects.length, valueClass: "" },
    { key: "complete", label: "complete", count: statusCounts.complete, valueClass: "acc" },
    { key: "wip", label: "in progress", count: statusCounts.wip, valueClass: "warn" },
  ];

  return (
    <div className="projects-shell">
      <div className="list-page-top">
        <PageHeader eyebrow="Projects" title="Things I've built" />

        <div className="stat-cards">
          {statusCards.map((card) => (
            <button
              key={card.key ?? "all"}
              type="button"
              className={`scard clickable${
                (card.key === null && !activeStack && !activeStatus) ||
                activeStatus === card.key
                  ? " active"
                  : ""
              }`}
              onClick={() => {
                setActiveStatus(card.key);
                if (card.key !== null) setActiveStack(null);
                else {
                  setActiveStack(null);
                  setActiveStatus(null);
                }
              }}
            >
              <div className={`sc-val ${card.valueClass}`.trim()}>{card.count}</div>
              <div className="sc-lab">{card.label}</div>
            </button>
          ))}
        </div>

        {allStacks.length > 0 && (
          <div className="admin-filter-row">
            {allStacks.map((stack) => (
              <button
                key={stack}
                type="button"
                className={`chip clickable${activeStack === stack ? " active" : ""}`}
                onClick={() => {
                  setActiveStack(activeStack === stack ? null : stack);
                  if (activeStack !== stack) setActiveStatus(null);
                }}
              >
                {stack}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="post-col">
        <div className="pc-header">
          <span className="pc-count">
            <span>{filtered.length}</span> projects
          </span>
        </div>

        <div className="post-list">
          <div className="table-scroll table-scroll--flush">
            <table className="post-table post-table--public post-table--projects">
              <colgroup>
                <col className="col-title" />
                <col className="col-meta" />
                <col className="col-meta" />
                <col className="col-meta" />
              </colgroup>
              <ListTableHead variant="projects" />
              <tbody>
                {pageProjects.map((project) => {
                  const metadata = docMetadata(project);
                  const topic = deriveTopic(metadata);
                  const href = projectCaseStudyHref(project.slug);
                  return (
                    <ProjectCard
                      key={project.slug}
                      href={href}
                      slug={project.slug}
                      name={project.title}
                      description={project.summary ?? ""}
                      accentColor={projectAccentColor(project.slug) ?? topicColor(topic)}
                      topic={topic}
                      status={projectStatusFromMetadata(metadata)}
                      tech={projectTech(metadata)}
                      github={projectGithub(metadata)}
                      browse={projectBrowseUrl(metadata)}
                      onNavigate={() => router.push(href)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="projects-empty">No projects match the filter.</p>
          )}
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
