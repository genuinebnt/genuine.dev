"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { PostDetail } from "../lib/api";
import { docMetadata } from "../lib/metadata";
import { extractPanelSections } from "../lib/pageToc";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { scrollToHashTarget } from "../lib/scrollRoot";
import { DocInteractive } from "./DocInteractive";
import { EditButton } from "./EditButton";

type Shell = "uses-shell" | "now-shell";

type Props = {
  doc: PostDetail;
  shell: Shell;
  scrollRootId: string;
  tocLabel: string;
  lastUpdated?: string;
  bodyHtml?: string;
  bodyBefore?: string;
  bodyAfter?: string;
  bodyExtra?: ReactNode;
};

/**
 * Two-column panel page: TOC rail + scrollable CMS body.
 * Used by `/uses` and `/now` (hybrid).
 */
export function PanelDocPage({
  doc,
  shell,
  scrollRootId,
  tocLabel,
  lastUpdated,
  bodyHtml,
  bodyBefore,
  bodyAfter,
  bodyExtra,
}: Props) {
  const meta = docMetadata(doc);
  const eyebrow = (meta.eyebrow as string | undefined) ?? doc.slug;
  const sections = useMemo(() => extractPanelSections(doc.body_html), [doc.body_html]);
  const [active, setActive] = useState(sections[0]?.label ?? "");

  useScrollSpy(sections, setActive, scrollRootId);

  const bodyClass = shell === "uses-shell" ? "uses-body" : "now-body";

  function scrollToSection(id: string, label: string) {
    setActive(label);
    const target = document.getElementById(id);
    const root = document.getElementById(scrollRootId);
    if (target && root) scrollToHashTarget(root, target);
  }

  return (
    <>
      <div className={shell}>
        <div className="now-toc">
          <div className="now-toc-h">{tocLabel}</div>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`now-toc-link${active === section.label ? " now-cur" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(section.id, section.label);
              }}
            >
              {section.label}
            </a>
          ))}
          {lastUpdated && (
            <>
              <hr className="now-toc-divider" />
              <div className="now-toc-updated">
                Last updated<br />
                <strong>{lastUpdated}</strong>
              </div>
            </>
          )}
        </div>

        <div id={scrollRootId} className={bodyClass} data-scroll-root>
          <div className="now-eyebrow">{eyebrow}</div>
          <h1 className="now-h1" style={shell === "uses-shell" ? { marginBottom: "4px" } : undefined}>
            {doc.title}
          </h1>
          {doc.summary && <div className="now-meta">{doc.summary}</div>}

          {bodyBefore && (
            <div className="prose panel-prose" dangerouslySetInnerHTML={{ __html: bodyBefore }} />
          )}
          {bodyExtra}
          {bodyAfter && (
            <div className="prose panel-prose" dangerouslySetInnerHTML={{ __html: bodyAfter }} />
          )}
          {bodyHtml && !bodyBefore && !bodyAfter && (
            <div className="prose panel-prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          )}
        </div>
      </div>
      <DocInteractive />
      <EditButton slug={doc.slug} />
    </>
  );
}
