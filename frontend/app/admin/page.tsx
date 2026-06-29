"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminDelete, adminList, adminSetStatus, getToken, type AdminItem } from "../../lib/auth";
import {
  adminRowAccent,
  adminRowDateDisplay,
  adminRowTags,
  adminRowTopic,
  adminTagsInUse,
  applyAdminSearch,
  applyTagFilter,
  effectiveStatus,
  filterAdminRows,
  filterFromSearchParams,
  statusBadgeClass,
  summarizeAdminStats,
  type AdminFilter,
} from "../../lib/adminDocs";
import { topicColor } from "../../lib/topic";
import {
  ADMIN_PAGE_SIZE,
  clampPage,
  paginateSlice,
  parsePageParam,
  writePageQuery,
} from "../../lib/pagination";
import AdminLogout from "../../components/AdminLogout";
import AdminFilterPanel from "../../components/admin/AdminFilterPanel";
import UiCheckbox from "../../components/ui/UiCheckbox";
import Pagination from "../../components/ui/Pagination";
import { isAdminEditable, isStaticCaseStudyRow, publicDocPath } from "../../lib/cmsPages";
import { PageHeader } from "../../components/ui/PageHeader";
import { readAdminPrefs, type AdminFilterLayout } from "../../lib/siteExtras";

export default function Admin() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminItem[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<AdminFilter>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterLayout, setFilterLayout] = useState<AdminFilterLayout>("toprow");
  const skipFilterReset = useRef(true);

  function load() {
    adminList().then(setRows).catch(() => router.push("/admin/login"));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/admin/login");
      return;
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFilterLayout(readAdminPrefs().filterLayout);
    const onPrefs = () => setFilterLayout(readAdminPrefs().filterLayout);
    window.addEventListener("admin-prefs-updated", onPrefs);
    return () => window.removeEventListener("admin-prefs-updated", onPrefs);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = filterFromSearchParams(params);
    if (fromUrl) setActiveFilter(fromUrl);
    const topic = params.get("topic");
    const tag = params.get("tag");
    if (tag) setActiveTag(tag);
    else if (topic) setActiveTag(topic);
    setPage(parsePageParam(params.get("page")));
  }, []);

  useEffect(() => {
    if (skipFilterReset.current) {
      skipFilterReset.current = false;
      return;
    }
    setPage(1);
    setSelected(new Set());
    writePageQuery(1);
  }, [activeFilter, activeTag, search]);

  async function del(slug: string) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      await adminDelete(slug);
      load();
    } catch {
      router.push("/admin/login");
    }
  }

  async function setStatus(slug: string, status: string) {
    try {
      await adminSetStatus(slug, status);
      load();
    } catch {
      router.push("/admin/login");
    }
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    let list = filterAdminRows(rows, activeFilter);
    list = applyTagFilter(list, activeTag);
    return applyAdminSearch(list, search);
  }, [rows, activeFilter, activeTag, search]);

  const pageRows = useMemo(
    () => paginateSlice(filtered, page, ADMIN_PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    setPage((current) => clampPage(current, filtered.length, ADMIN_PAGE_SIZE));
  }, [filtered.length]);

  function goToPage(next: number) {
    const clamped = clampPage(next, filtered.length, ADMIN_PAGE_SIZE);
    setPage(clamped);
    writePageQuery(clamped);
    setSelected(new Set());
  }

  const stats = useMemo(
    () => (rows ? summarizeAdminStats(rows) : { total: 0, published: 0, drafts: 0, scheduled: 0, projects: 0, pages: 0 }),
    [rows],
  );

  const tagsInUse = useMemo(() => (rows ? adminTagsInUse(rows) : []), [rows]);

  const selectableOnPage = useMemo(
    () => pageRows.filter((r) => !isStaticCaseStudyRow(r)),
    [pageRows],
  );

  function toggleSelect(slug: string) {
    const row = rows?.find((r) => r.slug === slug);
    if (row && isStaticCaseStudyRow(row)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === selectableOnPage.length && selectableOnPage.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableOnPage.map((r) => r.slug)));
    }
  }

  async function bulkSetStatus(status: string) {
    for (const slug of selected) {
      try {
        await adminSetStatus(slug, status);
      } catch {
        /* continue */
      }
    }
    setSelected(new Set());
    load();
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} item(s)?`)) return;
    for (const slug of selected) {
      try {
        await adminDelete(slug);
      } catch {
        /* continue */
      }
    }
    setSelected(new Set());
    load();
  }

  const contentList = (
    <>
      {selected.size > 0 && (
        <div className="admin-bulk-bar">
          <span className="admin-bulk-count">{selected.size} selected</span>
          <button type="button" className="ts-btn" onClick={() => void bulkSetStatus("published")}>
            Publish
          </button>
          <button type="button" className="ts-btn" onClick={() => void bulkSetStatus("draft")}>
            Unpublish
          </button>
          <button type="button" className="ts-btn" onClick={() => void bulkDelete()}>
            Delete
          </button>
          <button type="button" className="ts-btn ts-ghost-inline" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      <div className="table-scroll">
        <table className="post-table">
          <thead>
            <tr>
              <th className="post-table-check">
                <UiCheckbox
                  checked={selectableOnPage.length > 0 && selected.size === selectableOnPage.length}
                  onChange={() => toggleSelectAll()}
                  aria-label="Select all on page"
                />
              </th>
              <th>title / tags</th>
              <th>topic</th>
              <th>kind</th>
              <th>status</th>
              <th>date</th>
              <th style={{ textAlign: "right" }}>actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => {
              const topic = adminRowTopic(r);
              const tags = adminRowTags(r);
              const displayStatus = effectiveStatus(r);
              const date = adminRowDateDisplay(r);
              const accent = adminRowAccent(r);
              const staticRow = isStaticCaseStudyRow(r);
              const editable = isAdminEditable(r);
              const live = publicDocPath(r);
              return (
                <tr key={r.slug} className={selected.has(r.slug) ? "row-selected" : undefined}>
                  <td className="post-table-check">
                    <UiCheckbox
                      checked={selected.has(r.slug)}
                      onChange={() => toggleSelect(r.slug)}
                      disabled={staticRow}
                      aria-label={`Select ${r.slug}`}
                    />
                  </td>
                  <td className="pt-cell">
                    <span
                      className={`admin-row-bar topic-bar${accent.cssClass ? ` ${accent.cssClass}` : ""}`}
                      style={!accent.cssClass && accent.color ? { background: accent.color } : undefined}
                      aria-hidden
                    />
                    <div className="pt-cell-inner">
                      <div className="pt-title">{r.title}</div>
                      <div className="pt-slug">{r.slug}</div>
                      {tags.length > 0 && (
                        <div className="pt-tags">
                          {tags.map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`pt-tag clickable${activeTag === t ? " active" : ""}`}
                              onClick={() => setActiveTag(activeTag === t ? null : t)}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {topic ? (
                      <span className="admin-topic" style={{ color: topicColor(topic) }}>
                        {topic}
                      </span>
                    ) : (
                      <span className="admin-topic empty">—</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-kind">{r.kind}</span>
                    {staticRow && <span className="kind-badge static">static</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${statusBadgeClass(displayStatus)}`}>{displayStatus}</span>
                  </td>
                  <td>
                    <span className={`admin-date ${date.tone}`}>{date.label}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {editable && (
                        <Link className="ra" href={`/admin/edit/${r.slug}`}>
                          edit
                        </Link>
                      )}
                      {live &&
                        (displayStatus === "draft" || displayStatus === "scheduled" ? (
                          <Link className="ra" href={live} target="_blank">
                            preview
                          </Link>
                        ) : (
                          <Link className="ra" href={live} target="_blank">
                            view
                          </Link>
                        ))}
                      {editable && displayStatus === "published" && (
                        <button className="ra" type="button" onClick={() => setStatus(r.slug, "draft")}>
                          unpublish
                        </button>
                      )}
                      {editable && displayStatus === "scheduled" && (
                        <button className="ra" type="button" onClick={() => setStatus(r.slug, "draft")}>
                          unschedule
                        </button>
                      )}
                      {editable && (
                        <button className="ra del" type="button" onClick={() => del(r.slug)}>
                          delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalItems={filtered.length}
        pageSize={ADMIN_PAGE_SIZE}
        onPageChange={goToPage}
      />

      {filtered.length === 0 && (
        <p className="muted" style={{ padding: "16px 0", fontFamily: "var(--mono)", fontSize: "12px" }}>
          No items match the filter.
        </p>
      )}
    </>
  );

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Admin"
        title="Content"
        action={
          <div className="admin-toolbar">
            <div className="searchbar">
              <span style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: "12px" }}>⌕</span>
              <input placeholder="search content…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Link className="btn" href="/admin/settings">
              ⚙ Settings
            </Link>
            <Link className="btn" href="/admin/new">
              + New
            </Link>
            <AdminLogout />
          </div>
        }
      />

      {rows === null ? (
        <p className="muted">Loading…</p>
      ) : filterLayout === "sidebar" ? (
        <div className="admin-shell" data-rail-shell>
          <AdminFilterPanel
            variant="sidebar"
            stats={stats}
            activeFilter={activeFilter}
            activeTag={activeTag}
            tagsInUse={tagsInUse}
            onFilterChange={setActiveFilter}
            onTagChange={setActiveTag}
          />
          <div className="admin-shell-main">{contentList}</div>
        </div>
      ) : (
        <>
          <AdminFilterPanel
            variant="toprow"
            stats={stats}
            activeFilter={activeFilter}
            activeTag={activeTag}
            tagsInUse={tagsInUse}
            onFilterChange={setActiveFilter}
            onTagChange={setActiveTag}
          />
          {contentList}
        </>
      )}
    </div>
  );
}
