"use client";

import { useState } from "react";
import type { PostItem } from "../lib/api";
import { docMetadata } from "../lib/metadata";
import {
  PORTFOLIO_SLUGS,
  projectAccentColor,
  projectCaseStudyHref,
  projectStatusFromMetadata,
} from "../lib/projects";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { scrollToHashTarget } from "../lib/scrollRoot";
import ProjectCard from "./ProjectCard";

const SECTIONS = ["Building", "Learning", "Reading", "Fitness", "Not doing"] as const;

const NOW_SECTIONS = SECTIONS.map((label) => ({
  label,
  id: label.toLowerCase().replace(/\s+/g, "-"),
}));

interface Props {
  projects: PostItem[];
}

function portfolioProjects(projects: PostItem[]): PostItem[] {
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  return PORTFOLIO_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (p): p is PostItem => p != null,
  );
}

export default function NowPage({ projects }: Props) {
  const [active, setActive] = useState<(typeof SECTIONS)[number]>("Building");
  const portfolio = portfolioProjects(projects);

  useScrollSpy(NOW_SECTIONS, (label) => setActive(label as (typeof SECTIONS)[number]), "now-scroll-root");

  return (
    <div className="now-shell">
      <div className="now-toc">
        <div className="now-toc-h">On this page</div>
        {SECTIONS.map((section) => (
          <a
            key={section}
            href={`#${section.toLowerCase().replace(/\s+/g, "-")}`}
            className={`now-toc-link${active === section ? " now-cur" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActive(section);
              const target = document.getElementById(section.toLowerCase().replace(/\s+/g, "-"));
              const root = document.getElementById("now-scroll-root");
              if (target && root) scrollToHashTarget(root, target);
            }}
          >
            {section}
          </a>
        ))}
        <hr className="now-toc-divider" />
        <div className="now-toc-updated">
          Last updated<br />
          <strong>June 2026</strong>
        </div>
      </div>

      <div id="now-scroll-root" className="now-body" data-scroll-root>
        <div className="now-eyebrow">Now</div>
        <h1 className="now-h1">What I&rsquo;m doing right now</h1>
        <div className="now-meta">Updated June 2026 · inspired by nownownow.com</div>

        <h2 className="now-h2" id="building">
          Building
        </h2>
        <p className="now-p">
          Shipping the third portfolio project — <strong>db-labs</strong>, a from-scratch DBMS in Rust —
          while finishing <strong>genuine.dev</strong>. NotiQ is done. Buffer pool manager is the
          current build focus.
        </p>
        <div className="now-status-grid">
          <div className="now-status-card">
            <div className="nsc-label">current project</div>
            <div className="nsc-val nsc-val-purple">db-labs</div>
            <div className="nsc-sub">from-scratch DBMS · P1 buffer pool</div>
          </div>
          <div className="now-status-card">
            <div className="nsc-label">job hunt</div>
            <div className="nsc-val nsc-val-warn">Jan 2027</div>
            <div className="nsc-sub">targeting DB-infra companies</div>
          </div>
        </div>

        <div className="now-portfolio-block">
          <div className="now-portfolio-label">portfolio projects</div>
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

        <h2 className="now-h2" id="learning">
          Learning
        </h2>
        <p className="now-p">
          Bug bounty on Bugcrowd — rotating through auth and business logic bugs right now. Reading
          CMU 15-445 lecture notes alongside building. Hindi through songs as dual language + singing
          practice.
        </p>
        <div className="now-chip-row">
          {["bug bounty", "DB internals"].map((chip) => (
            <span key={chip} className="now-chip now-acc">
              {chip}
            </span>
          ))}
          {["Hindi", "guitar"].map((chip) => (
            <span key={chip} className="now-chip">
              {chip}
            </span>
          ))}
        </div>

        <h2 className="now-h2" id="reading">
          Reading
        </h2>
        {[
          {
            color: "var(--acc)",
            title: "Database Internals",
            author: "Alex Petrov",
            progress: "ch. 4 of 14 — B-tree internals",
          },
          {
            color: "var(--purple)",
            title: "Rust Atomics and Locks",
            author: "Mara Bos",
            progress: "finished — reference",
          },
        ].map((book) => (
          <div key={book.title} className="now-reading">
            <div className="nr-spine" style={{ background: book.color }} />
            <div>
              <div className="nr-title">{book.title}</div>
              <div className="nr-author">{book.author}</div>
              <div className="nr-progress">{book.progress}</div>
            </div>
          </div>
        ))}

        <h2 className="now-h2" id="fitness">
          Fitness
        </h2>
        <p className="now-p">
          Calisthenics three times a week — working towards a clean muscle-up. Running 5K twice a
          week for baseline cardio. No gym, bodyweight only.
        </p>
        <div className="now-chip-row">
          {["calisthenics", "running"].map((chip) => (
            <span key={chip} className="now-chip">
              {chip}
            </span>
          ))}
        </div>

        <h2 className="now-h2" id="not-doing">
          Not doing
        </h2>
        <p className="now-p">
          Not doing freelance work. Not doing hackathons or side projects outside the portfolio.
          Not on social media other than GitHub. Focused mode until the three case studies ship.
        </p>
      </div>
    </div>
  );
}
