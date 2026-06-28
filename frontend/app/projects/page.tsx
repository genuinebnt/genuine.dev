import { Suspense } from "react";
import { getProjects } from "../../lib/api";
import ProjectsShell from "../../components/ProjectsShell";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const projects = await getProjects();
  return (
    <Suspense fallback={<div className="projects-shell"><p className="muted" style={{ padding: 24 }}>Loading…</p></div>}>
      <ProjectsShell projects={projects} />
    </Suspense>
  );
}
