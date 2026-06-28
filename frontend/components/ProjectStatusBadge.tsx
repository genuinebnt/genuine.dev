import { projectStatusLabel, type ProjectStatus } from "../lib/projects";

interface Props {
  status: ProjectStatus | null;
}

/** Green complete / amber in-progress pill — only when metadata.status is set. */
export default function ProjectStatusBadge({ status }: Props) {
  if (!status) return null;
  return (
    <span className={`pc-badge ${status === "complete" ? "complete" : "wip"}`}>
      {projectStatusLabel(status)}
    </span>
  );
}
