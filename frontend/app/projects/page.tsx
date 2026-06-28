import { getProjects } from "../../lib/api";
import ProjectsShell from "../../components/ProjectsShell";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const projects = await getProjects();
  return <ProjectsShell projects={projects} />;
}
