import Link from "next/link";
import type { PostDetail } from "../lib/api";
import { EditButton } from "./EditButton";

const SKILLS = [
  "Rust",
  "Systems programming",
  "Distributed systems",
  "Postgres",
  "Offensive security",
  "Bug bounty",
];

/**
 * About page layout from the mockup: avatar column + bio / timeline / skills.
 * Timeline section label is emitted by the backend renderer with the directive HTML.
 */
export default function AboutShell({ doc }: { doc: PostDetail }) {
  return (
    <>
      <div className="about-page">
        <div className="about-shell">
          <aside className="about-sidebar">
            <div className="avatar-lg" aria-hidden>
              🦀
            </div>
            <h1 className="about-name">{doc.title}</h1>
            <p className="about-tagline">{doc.summary ?? "Systems engineer · Rust · Infosec"}</p>

            <div className="about-nav-links">
              <Link href="/now" className="about-link-pill">
                /now
              </Link>
              <Link href="/uses" className="about-link-pill">
                /uses
              </Link>
              <Link href="/blog" className="about-link-pill">
                Articles
              </Link>
              <Link href="/projects" className="about-link-pill">
                Projects
              </Link>
            </div>

            <div className="meta-row" style={{ marginTop: "18px" }}>
              <span className="meta-pill">
                <strong>Focus</strong> Rust
              </span>
              <span className="meta-pill">
                <strong>Writing</strong> systems · infosec
              </span>
              <span className="meta-pill">
                <strong>Bounty</strong> active
              </span>
            </div>

            <div className="divider5" style={{ margin: "22px 0" }}>
              <div style={{ background: "var(--warn)" }} />
              <div style={{ background: "var(--purple)" }} />
              <div style={{ background: "var(--blue)" }} />
              <div style={{ background: "var(--acc)" }} />
              <div style={{ background: "var(--faint)" }} />
            </div>

            <div className="section-label" style={{ marginTop: 0 }}>
              skills
            </div>
            <div className="chips">
              {SKILLS.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </aside>

          <div className="about-body">
            <div className="about-right">
              {doc.body_html && (
                <div className="prose" dangerouslySetInnerHTML={{ __html: doc.body_html }} />
              )}
            </div>
          </div>
        </div>
      </div>
      <EditButton slug={doc.slug} />
    </>
  );
}
