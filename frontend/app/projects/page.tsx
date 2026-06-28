import Link from "next/link";
import { getProjects } from "../../lib/api";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const projects = await getProjects();
  return (
    <>
      <p className="eyebrow">Projects</p>
      <h1 style={{ fontSize: "32px", fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "16px" }}>
        Things I&apos;ve <span>built</span>.
      </h1>
      <div className="section-label" style={{ marginTop: "40px" }}>selected work</div>
      <div className="card-grid">
        {projects.map((p) => (
          <Link key={p.slug} className="proj" href={`/projects/${p.slug}`}>
            <h3>{p.title}</h3>
            <div className="pd">{p.summary ?? ""}</div>
            <div className="tstack">
              {(p.metadata?.tech || []).map((t: string) => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
            <div className="links">
              <span>case study &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
