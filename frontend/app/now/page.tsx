import { getProjects } from "../../lib/api";
import NowPage from "../../components/NowPage";

export const dynamic = "force-dynamic";

export default async function Now() {
  const projects = await getProjects();
  return <NowPage projects={projects} />;
}
