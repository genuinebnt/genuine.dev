"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostDetail } from "../lib/api";
import { extractPanelSections } from "../lib/pageToc";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { scrollToHashTarget } from "../lib/scrollRoot";
import { DocInteractive } from "./DocInteractive";
import { EditButton } from "./EditButton";
import { RailToggle } from "./ui/RailToggle";

const SKILLS = [
  "Rust",
  "Systems programming",
  "Distributed systems",
  "Postgres",
  "Offensive security",
  "Bug bounty",
];

/** About page — profile rail + on-page TOC + CMS prose. */
export default function AboutDocPage({ doc }: { doc: PostDetail }) {
  const sections = useMemo(() => extractPanelSections(doc.body_html), [doc.body_html]);
  const [active, setActive] = useState(sections[0]?.label ?? "");

  useScrollSpy(sections, setActive, "about-scroll-root");

  function scrollToSection(id: string, label: string) {
    setActive(label);
    const target = document.getElementById(id);
    const root = document.getElementById("about-scroll-root");
    if (target && root) scrollToHashTarget(root, target);
  }

  return (
    <>
      <div className="about-page">
        <div className="about-shell" data-rail-shell>
          <aside className="about-sidebar">
            <RailToggle storageKey="rail-about" label="profile" />
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

            {sections.length > 0 && (
              <>
                <hr className="now-toc-divider" />
                <div className="now-toc-h">On this page</div>
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`now-toc-link${active === section.label ? " now-cur" : ""}${
                      section.level === 3 ? " now-toc-sub" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(section.id, section.label);
                    }}
                  >
                    {section.label}
                  </a>
                ))}
              </>
            )}
          </aside>

          <div id="about-scroll-root" className="about-body" data-scroll-root>
            <div className="about-right">
              {doc.body_html && (
                <div className="prose" dangerouslySetInnerHTML={{ __html: doc.body_html }} />
              )}
            </div>
          </div>
        </div>
      </div>
      <DocInteractive />
      <EditButton slug={doc.slug} />
    </>
  );
}
