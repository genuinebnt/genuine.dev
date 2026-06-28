import Link from "next/link";
import type { ReactNode } from "react";
import ProjectStatusBadge from "./ProjectStatusBadge";
import type { ProjectStatus } from "../lib/projects";

export interface ProjectCardProps {
  href: string;
  name: string;
  description: string;
  accentColor: string;
  status?: ProjectStatus | null;
  tech?: string[];
  github?: string;
  browse?: string;
  footer?: ReactNode;
}

/** Shared project card — used on /projects, /now, and anywhere else listing portfolio work. */
export default function ProjectCard({
  href,
  name,
  description,
  accentColor,
  status = null,
  tech = [],
  github,
  browse,
  footer,
}: ProjectCardProps) {
  return (
    <div className="project-card">
      <Link
        href={href}
        className="project-card-stretch"
        aria-label={`Open ${name} case study`}
      />
      <div className="pc-bar" style={{ background: accentColor }} />
      <div className="pc-inner">
        <div className="pc-top">
          <div className="pc-name">{name}</div>
          <ProjectStatusBadge status={status} />
        </div>
        <div className="pc-desc">{description}</div>
        <div className="pc-footer">
          {tech.length > 0 && (
            <div className="pc-chips">
              {tech.map((t) => (
                <span key={t} className="pc-chip">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="pc-links">
            <Link href={href} className="pc-link-primary">
              {footer ?? "case study →"}
            </Link>
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="pc-link-external"
              >
                github →
              </a>
            )}
            {browse && (
              <a
                href={browse}
                target="_blank"
                rel="noopener noreferrer"
                className="pc-link-external"
              >
                browse →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
