import Link from "next/link";
import { getProjects } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const projects = await getProjects();
  return (
    <>
      <p className="eyebrow">Projects</p>
      <h1>
        Things I&apos;ve <span>built</span>.
      </h1>
      <div className="section-label">selected work</div>
      <div className="card-grid">
        {projects.map((p) => (
          <Link key={p.slug} className="card" href={`/projects/${p.slug}`}>
            <h3>{p.title}</h3>
            <p>{p.summary ?? ""}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
