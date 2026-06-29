"use client";

import Link from "next/link";
import type { AdminItem } from "../../lib/admin/types";
import { isStaticCaseStudy } from "../../lib/cmsPages";

type GroupedDocs = {
  posts: AdminItem[];
  pages: AdminItem[];
  projects: AdminItem[];
};

export default function EditorFileTree({
  docs,
  filter,
  onFilterChange,
  collapsed,
  onToggleCollapse,
  grouped,
  activeSlug,
  isDirty,
  isNewDoc,
  onOpenTab,
}: {
  docs: AdminItem[];
  filter: string;
  onFilterChange: (value: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  grouped: GroupedDocs;
  activeSlug: string;
  isDirty: boolean;
  isNewDoc: boolean;
  onOpenTab: (slug: string) => void;
}) {
  void docs;

  function renderRows(items: AdminItem[], showDraftBadge = true) {
    return items.map((d) => (
      <Link
        key={d.slug}
        href={`/admin/edit/${d.slug}`}
        className={`file-row${d.slug === activeSlug ? " active" : ""}`}
        onClick={() => onOpenTab(d.slug)}
      >
        <span className="ficon">{d.slug === activeSlug ? "◆" : "◇"}</span>
        <span className="fname">{d.slug}.md</span>
        {d.slug === activeSlug && isDirty && <span className="fbadge">M</span>}
        {d.slug === activeSlug && isNewDoc && <span className="fbadge new">N</span>}
        {showDraftBadge && d.status === "draft" && d.slug !== activeSlug && (
          <span className="fbadge">D</span>
        )}
      </Link>
    ));
  }

  if (collapsed) {
    return (
      <div className="file-tree rail-collapsed">
        <button
          type="button"
          className="rail-reopen"
          title="Expand content tree"
          aria-label="Expand content tree"
          onClick={onToggleCollapse}
        >
          »
        </button>
      </div>
    );
  }

  return (
    <div className="file-tree">
      <div className="ft-header">
        <span className="ft-title">Content</span>
        <div className="ft-actions">
          <Link href="/admin/new" className="ft-btn" title="New post">
            +
          </Link>
          <button
            type="button"
            className="ft-btn"
            title="Collapse"
            aria-label="Collapse content tree"
            onClick={onToggleCollapse}
          >
            «
          </button>
        </div>
      </div>
      <div className="ft-search">
        <span style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: "11px" }}>⌕</span>
        <input placeholder="filter…" value={filter} onChange={(e) => onFilterChange(e.target.value)} />
      </div>
      {!collapsed && (
        <div className="file-list">
          {grouped.posts.length > 0 && (
            <>
              <div className="dir-row">
                <span className="dicon">▾</span>
                <span className="dname">posts</span>
                <span className="dcount">{grouped.posts.length}</span>
              </div>
              {renderRows(grouped.posts)}
            </>
          )}
          {grouped.pages.length > 0 && (
            <>
              <div className="dir-row">
                <span className="dicon">▾</span>
                <span className="dname">pages</span>
                <span className="dcount">{grouped.pages.length}</span>
              </div>
              {renderRows(grouped.pages, false)}
            </>
          )}
          {grouped.projects.length > 0 && (
            <>
              <div className="dir-row">
                <span className="dicon">▾</span>
                <span className="dname">projects</span>
                <span className="dcount">{grouped.projects.length}</span>
              </div>
              {renderRows(grouped.projects, false)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function groupEditorDocs(docs: AdminItem[], filter: string): GroupedDocs {
  const q = filter.toLowerCase();
  const filtered = docs.filter(
    (d) => !q || d.title.toLowerCase().includes(q) || d.slug.includes(q),
  );
  return {
    posts: filtered.filter((d) => d.kind === "post"),
    projects: filtered.filter((d) => d.kind === "project" && !isStaticCaseStudy(d.slug)),
    pages: filtered.filter((d) => d.kind === "page"),
  };
}
