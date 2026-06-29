import Link from "next/link";
import type { ReactNode } from "react";
import ProjectStatusBadge from "./ProjectStatusBadge";
import ContentRowBars, { type RowStatusStrip } from "./ui/ContentRowBars";
import type { ProjectStatus } from "../lib/projects";
import { topicColor } from "../lib/topic";

export interface ProjectCardProps {
  href: string;
  slug: string;
  name: string;
  description: string;
  accentColor: string;
  topic?: string;
  status?: ProjectStatus | null;
  tech?: string[];
  github?: string;
  browse?: string;
  footer?: ReactNode;
  onNavigate?: () => void;
}

function projectStatusStrip(status: ProjectStatus | null): RowStatusStrip {
  if (status === "complete") return "complete";
  if (status === "wip") return "wip";
  return "muted";
}

/** Shared project row — flush list style on /projects; card chrome elsewhere. */
export default function ProjectCard({
  href,
  slug,
  name,
  description,
  accentColor,
  topic = "",
  status = null,
  tech = [],
  github,
  browse,
  footer,
  onNavigate,
}: ProjectCardProps) {
  return (
    <tr
      className="project-row public-table-row"
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate?.();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open ${name} case study`}
    >
      <td className="pt-cell pt-cell--bars">
        <ContentRowBars status={projectStatusStrip(status)} topicColor={accentColor} />
        <div className="pt-cell-inner">
          <div className="pt-title">{name}</div>
          <div className="pt-slug">{slug}</div>
          {description && <div className="pt-summary">{description}</div>}
          {tech.length > 0 && (
            <div className="pt-tags">
              {tech.map((t) => (
                <span key={t} className="pt-tag">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="col-meta">
        {topic ? (
          <span className="admin-topic" style={{ color: topicColor(topic) }}>
            {topic}
          </span>
        ) : tech[0] ? (
          <span className="admin-topic" style={{ color: accentColor }}>
            {tech[0].toLowerCase()}
          </span>
        ) : (
          <span className="admin-topic empty">—</span>
        )}
      </td>
      <td className="col-meta">
        <ProjectStatusBadge status={status} />
      </td>
      <td className="col-meta">
        <div className="row-actions">
          <Link href={href} className="ra" onClick={(e) => e.stopPropagation()}>
            {footer ?? "case study →"}
          </Link>
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="ra"
              onClick={(e) => e.stopPropagation()}
            >
              github →
            </a>
          )}
          {browse && (
            <a
              href={browse}
              target="_blank"
              rel="noopener noreferrer"
              className="ra"
              onClick={(e) => e.stopPropagation()}
            >
              browse →
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}
