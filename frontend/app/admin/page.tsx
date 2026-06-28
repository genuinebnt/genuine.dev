"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminDelete, adminList, adminSetStatus, getToken, type AdminItem } from "../../lib/auth";
import { isAdminEditable, publicDocPath } from "../../lib/cmsPages";
import { PageHeader } from "../../components/ui/PageHeader";

const FILTERS = ["all", "posts", "projects", "pages", "drafts", "published"] as const;
type Filter = (typeof FILTERS)[number];

function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "published": return "published";
    case "draft": return "draft";
    case "scheduled": return "scheduled";
    default: return "draft";
  }
}

export default function Admin() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminItem[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

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

  async function del(slug: string) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try { await adminDelete(slug); load(); }
    catch { router.push("/admin/login"); }
  }

  async function setStatus(slug: string, status: string) {
    try { await adminSetStatus(slug, status); load(); }
    catch { router.push("/admin/login"); }
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    switch (activeFilter) {
      case "posts": return rows.filter((r) => r.kind === "post");
      case "projects": return rows.filter((r) => r.kind === "project");
      case "pages": return rows.filter((r) => r.kind === "page");
      case "drafts": return rows.filter((r) => r.status === "draft");
      case "published": return rows.filter((r) => r.status === "published");
      default: return rows;
    }
  }, [rows, activeFilter]);

  const stats = useMemo(() => {
    if (!rows) return { total: 0, published: 0, drafts: 0, projects: 0, pages: 0 };
    return {
      total: rows.length,
      published: rows.filter((r) => r.status === "published").length,
      drafts: rows.filter((r) => r.status === "draft").length,
      projects: rows.filter((r) => r.kind === "project").length,
      pages: rows.filter((r) => r.kind === "page").length,
    };
  }, [rows]);

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Admin"
        title="Content"
        action={
          <>
            <Link className="btn" href="/admin/settings/theme" style={{ marginRight: "8px" }}>
              ◑ Theme
            </Link>
            <Link className="btn" href="/admin/new">
              + New
            </Link>
          </>
        }
      />

      {rows === null ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          {/* Stat cards */}
          <div className="stat-cards">
            <div className="scard">
              <div className="sc-val">{stats.total}</div>
              <div className="sc-lab">total docs</div>
            </div>
            <div className="scard">
              <div className="sc-val acc">{stats.published}</div>
              <div className="sc-lab">published</div>
            </div>
            <div className="scard">
              <div className="sc-val warn">{stats.drafts}</div>
              <div className="sc-lab">drafts</div>
            </div>
            <div className="scard">
              <div className="sc-val blue">{stats.projects}</div>
              <div className="sc-lab">projects</div>
            </div>
            <div className="scard">
              <div className="sc-val blue">{stats.pages}</div>
              <div className="sc-lab">pages</div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="admin-filter-row">
            {FILTERS.map((f) => (
              <span
                key={f}
                className={`chip clickable${activeFilter === f ? " active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </span>
            ))}
          </div>

          {/* Post table */}
          <div className="table-scroll">
          <table className="post-table">
            <thead>
              <tr>
                <th>title / slug</th>
                <th>kind</th>
                <th>status</th>
                <th style={{ textAlign: "right" }}>actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.slug}>
                  <td>
                    <div className="pt-title">{r.title}</div>
                    <div className="pt-tags">
                      <span className="pt-tag">{r.slug}</span>
                    </div>
                  </td>
                  <td>
                    <span className="muted" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                      {r.kind}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${statusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {isAdminEditable(r) ? (
                        <Link className="ra" href={`/admin/edit/${r.slug}`}>edit</Link>
                      ) : (
                        <span className="muted" style={{ fontFamily: "var(--mono)", fontSize: "11px" }}>
                          static case study
                        </span>
                      )}
                      {(() => {
                        const live = publicDocPath(r);
                        if (!live) return null;
                        if (r.status === "draft") {
                          return (
                            <Link className="ra" href={live} target="_blank">preview</Link>
                          );
                        }
                        return (
                          <Link className="ra" href={live} target="_blank">view</Link>
                        );
                      })()}
                      {r.status === "published" && (
                        <button className="ra" onClick={() => setStatus(r.slug, "draft")}>unpublish</button>
                      )}
                      {r.status === "scheduled" && (
                        <button className="ra" onClick={() => setStatus(r.slug, "draft")}>unschedule</button>
                      )}
                      <button className="ra del" onClick={() => del(r.slug)}>delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {filtered.length === 0 && (
            <p className="muted" style={{ padding: "16px 0", fontFamily: "var(--mono)", fontSize: "12px" }}>
              No items match the filter.
            </p>
          )}
        </>
      )}
    </div>
  );
}
