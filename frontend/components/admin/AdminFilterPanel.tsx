"use client";

import { RailToggle } from "../ui/RailToggle";
import type { AdminFilter } from "../../lib/adminDocs";

export type AdminStats = {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  projects: number;
  pages: number;
};

type Props = {
  variant: "toprow" | "sidebar";
  stats: AdminStats;
  activeFilter: AdminFilter;
  activeTag: string | null;
  tagsInUse: string[];
  onFilterChange: (filter: AdminFilter) => void;
  onTagChange: (tag: string | null) => void;
};

const STATUS_FILTERS: { filter: AdminFilter; label: string; dotClass?: string }[] = [
  { filter: "all", label: "all" },
  { filter: "published", label: "published", dotClass: "published" },
  { filter: "drafts", label: "drafts", dotClass: "draft" },
  { filter: "scheduled", label: "scheduled", dotClass: "scheduled" },
];

const KIND_FILTERS: { filter: AdminFilter; label: string }[] = [
  { filter: "posts", label: "posts" },
  { filter: "projects", label: "projects" },
  { filter: "pages", label: "pages" },
];

function statForFilter(filter: AdminFilter, stats: AdminStats): number {
  switch (filter) {
    case "published":
      return stats.published;
    case "drafts":
      return stats.drafts;
    case "scheduled":
      return stats.scheduled;
    case "projects":
      return stats.projects;
    case "pages":
      return stats.pages;
    case "posts":
      return stats.total - stats.projects - stats.pages;
    default:
      return stats.total;
  }
}

function TopRowFilters({
  stats,
  activeFilter,
  activeTag,
  tagsInUse,
  onFilterChange,
  onTagChange,
}: Omit<Props, "variant">) {
  const statCards = [
    { filter: "published" as AdminFilter, value: stats.published, valueClass: "acc", label: "published" },
    { filter: "drafts" as AdminFilter, value: stats.drafts, valueClass: "warn", label: "drafts" },
    { filter: "scheduled" as AdminFilter, value: stats.scheduled, valueClass: "blue", label: "scheduled" },
    { filter: "all" as AdminFilter, value: stats.total, valueClass: "", label: "total docs" },
    { filter: "projects" as AdminFilter, value: stats.projects, valueClass: "blue", label: "projects" },
    { filter: "pages" as AdminFilter, value: stats.pages, valueClass: "blue", label: "pages" },
  ];

  return (
    <>
      <div className="stat-cards">
        {statCards.map((card) => (
          <button
            key={card.filter}
            type="button"
            className={`scard clickable${activeFilter === card.filter ? " active" : ""}`}
            onClick={() => onFilterChange(card.filter)}
          >
            <div className={`sc-val ${card.valueClass}`.trim()}>{card.value}</div>
            <div className="sc-lab">{card.label}</div>
          </button>
        ))}
      </div>

      {tagsInUse.length > 0 && (
        <div className="admin-filter-row">
          {tagsInUse.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip clickable${activeTag === t ? " active" : ""}`}
              onClick={() => onTagChange(activeTag === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function SidebarFilters({
  stats,
  activeFilter,
  activeTag,
  tagsInUse,
  onFilterChange,
  onTagChange,
}: Omit<Props, "variant">) {
  return (
    <div className="filter-col">
      <RailToggle storageKey="rail-admin-filters" label="filters" />
      <div className="fc-header">
        <div className="fc-eyebrow">Admin</div>
        <div className="fc-title">Content</div>
      </div>
      <div className="fc-body">
        <div className="filter-section">
          <div className="fs-h">status</div>
          {STATUS_FILTERS.map(({ filter, label, dotClass }) => (
            <div
              key={filter}
              className={`filter-item${activeFilter === filter && !activeTag ? " wri-active" : ""}`}
              onClick={() => onFilterChange(filter)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onFilterChange(filter);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span
                className={`fi-dot${dotClass ? ` status-dot ${dotClass}` : ""}`}
                style={!dotClass ? { background: "var(--muted)" } : undefined}
              />
              <span className="fi-label">{label}</span>
              <span className="fi-count">{statForFilter(filter, stats)}</span>
            </div>
          ))}
        </div>

        <div className="filter-section">
          <div className="fs-h">kind</div>
          {KIND_FILTERS.map(({ filter, label }) => (
            <div
              key={filter}
              className={`filter-item${activeFilter === filter && !activeTag ? " wri-active" : ""}`}
              onClick={() => onFilterChange(filter)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onFilterChange(filter);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className="fi-dot" style={{ background: "var(--faint)" }} />
              <span className="fi-label">{label}</span>
              <span className="fi-count">{statForFilter(filter, stats)}</span>
            </div>
          ))}
        </div>

        {tagsInUse.length > 0 && (
          <div className="filter-section">
            <div className="fs-h">tags</div>
            {tagsInUse.map((tag) => (
              <div
                key={tag}
                className={`filter-item${activeTag === tag ? " wri-active" : ""}`}
                onClick={() => onTagChange(activeTag === tag ? null : tag)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTagChange(activeTag === tag ? null : tag);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className="fi-dot" style={{ background: "var(--faint)" }} />
                <span className="fi-label">{tag}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Shared admin list filters — stat cards + chips (top row) or sidebar rail. */
export default function AdminFilterPanel({ variant, ...props }: Props) {
  if (variant === "sidebar") return <SidebarFilters {...props} />;
  return <TopRowFilters {...props} />;
}
