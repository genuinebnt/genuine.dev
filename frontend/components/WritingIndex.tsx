"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PostItem } from "../lib/api";
import { searchPosts } from "../lib/api";
import { deriveTopic, topicCssClass, topicColor, TOPIC_KEYS } from "../lib/topic";
import {
  WRITING_PAGE_SIZE,
  clampPage,
  paginateSlice,
  parsePageParam,
} from "../lib/pagination";
import Pagination from "./ui/Pagination";
import ContentRowBars from "./ui/ContentRowBars";
import ListTableHead from "./ui/ListTableHead";
import { PageHeader } from "./ui/PageHeader";

function formatListDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function isNew(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return Date.now() - new Date(dateStr).getTime() < 14 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

interface Props {
  initialPosts: PostItem[];
}

export default function WritingIndex({ initialPosts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipFilterReset = useRef(true);
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<PostItem[] | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    initialPosts.forEach((p) => {
      (p.metadata?.tags as string[] | undefined)?.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [initialPosts]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialPosts.forEach((p) => {
      const t = deriveTopic(p.metadata as Record<string, unknown> | undefined);
      if (t) counts[t] = (counts[t] ?? 0) + 1;
    });
    return counts;
  }, [initialPosts]);

  async function onSearch(value: string) {
    setQ(value);
    if (!value.trim()) { setSearchResults(null); return; }
    try { setSearchResults(await searchPosts(value)); } catch { setSearchResults([]); }
  }

  useEffect(() => {
    const topic = searchParams.get("topic");
    const tag = searchParams.get("tag");
    const query = searchParams.get("q");
    if (topic) setActiveTopic(topic);
    if (tag) setActiveTag(tag);
    if (query) void onSearch(query);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const basePosts = searchResults ?? initialPosts;
  const filtered = basePosts.filter((p) => {
    if (activeTopic) {
      const t = deriveTopic(p.metadata as Record<string, unknown> | undefined);
      if (t !== activeTopic) return false;
    }
    if (activeTag) {
      const tags = (p.metadata?.tags as string[] | undefined) ?? [];
      if (!tags.includes(activeTag)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return sort === "newest" ? db - da : da - db;
  });

  const page = parsePageParam(searchParams.get("page"));
  const pagedPosts = useMemo(
    () => paginateSlice(sorted, page, WRITING_PAGE_SIZE),
    [sorted, page],
  );

  function goToPage(next: number) {
    const clamped = clampPage(next, sorted.length, WRITING_PAGE_SIZE);
    const params = new URLSearchParams(searchParams.toString());
    if (clamped <= 1) params.delete("page");
    else params.set("page", String(clamped));
    const qs = params.toString();
    router.replace(qs ? `/blog?${qs}` : "/blog", { scroll: false });
  }

  useEffect(() => {
    if (skipFilterReset.current) {
      skipFilterReset.current = false;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/blog?${qs}` : "/blog", { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic, activeTag, sort, q]);

  const byYear = useMemo(() => {
    const map = new Map<number, PostItem[]>();
    pagedPosts.forEach((p) => {
      const yr = p.date ? new Date(p.date).getFullYear() : 0;
      if (!map.has(yr)) map.set(yr, []);
      map.get(yr)!.push(p);
    });
    return [...map.entries()].sort(([a], [b]) => (sort === "newest" ? b - a : a - b));
  }, [pagedPosts, sort]);

  const topicCards = [
    { key: null as string | null, label: "all posts", count: initialPosts.length, valueClass: "" },
    ...TOPIC_KEYS.filter((t) => topicCounts[t] !== undefined).map((t) => ({
      key: t,
      label: t,
      count: topicCounts[t] ?? 0,
      valueClass: topicCssClass(t) ? "" : "",
    })),
  ];

  return (
    <div className="wri-shell">
      <div className="list-page-top">
        <PageHeader
          eyebrow="Articles"
          title="All posts"
          action={
            <div className="searchbar">
              <span style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: "12px" }}>⌕</span>
              <input
                placeholder="search posts…"
                value={q}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          }
        />

        <div className="stat-cards">
          {topicCards.map((card) => (
            <button
              key={card.key ?? "all"}
              type="button"
              className={`scard clickable${activeTopic === card.key && !activeTag ? " active" : ""}`}
              onClick={() => { setActiveTopic(card.key); setActiveTag(null); }}
            >
              <div className={`sc-val ${card.valueClass}`.trim()}>{card.count}</div>
              <div className="sc-lab">{card.label}</div>
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="admin-filter-row">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`chip clickable${activeTag === tag ? " active" : ""}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="sort-row">
          <span className="sort-label">sort</span>
          <div className="sort-opts">
            <span
              className={`sort-opt${sort === "newest" ? " sel" : ""}`}
              onClick={() => setSort("newest")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSort("newest");
                }
              }}
              role="button"
              tabIndex={0}
            >
              newest
            </span>
            <span
              className={`sort-opt${sort === "oldest" ? " sel" : ""}`}
              onClick={() => setSort("oldest")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSort("oldest");
                }
              }}
              role="button"
              tabIndex={0}
            >
              oldest
            </span>
          </div>
        </div>
      </div>

      <div className="post-col">
        <div className="pc-header">
          <span className="pc-count">
            <span>{sorted.length}</span> posts
          </span>
        </div>

        <div className="post-list">
          <div className="table-scroll table-scroll--flush">
            <table className="post-table post-table--public post-table--articles">
              <colgroup>
                <col className="col-title" />
                <col className="col-meta" />
                <col className="col-meta" />
                <col className="col-meta" />
              </colgroup>
              <ListTableHead variant="articles" />
              <tbody>
                {byYear.map(([year, posts]) => (
                  <Fragment key={year}>
                    <tr key={`year-${year}`} className="year-row">
                      <td colSpan={4}>
                        <div className="year-row-inner">
                          <span className="yr-label">{year}</span>
                          <span className="yr-line" />
                          <span className="yr-count">{posts.length} posts</span>
                        </div>
                      </td>
                    </tr>
                    {posts.map((p) => {
                      const topic = deriveTopic(p.metadata as Record<string, unknown> | undefined);
                      const cssClass = topicCssClass(topic);
                      const color = topicColor(topic);
                      const tags = (p.metadata?.tags as string[] | undefined) ?? [];
                      return (
                        <tr
                          key={p.slug}
                          className="public-table-row"
                          onClick={() => router.push(`/blog/${p.slug}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/blog/${p.slug}`);
                            }
                          }}
                          tabIndex={0}
                          role="link"
                          aria-label={`Read ${p.title}`}
                        >
                          <td className="pt-cell pt-cell--bars">
                            <ContentRowBars
                              status="published"
                              topicClass={cssClass}
                              topicColor={cssClass ? undefined : color}
                            />
                            <div className="pt-cell-inner">
                              <div className="pt-title-row">
                                <div className="pt-title">{p.title}</div>
                                {isNew(p.date) && <span className="new-badge">new</span>}
                              </div>
                              <div className="pt-slug">{p.slug}</div>
                              {tags.length > 0 && (
                                <div className="pt-tags">
                                  {tags.map((t) => (
                                    <span key={t} className="pt-tag">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="col-meta">
                            {topic ? (
                              <span className="admin-topic" style={{ color }}>
                                {topic}
                              </span>
                            ) : (
                              <span className="admin-topic empty">—</span>
                            )}
                          </td>
                          <td className="col-meta">
                            <span className="admin-date">{formatListDate(p.date)}</span>
                          </td>
                          <td className="col-meta col-meta--end">
                            <span className="admin-date">{p.reading_min} min</span>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && (
            <div style={{ padding: "24px 16px", color: "var(--faint)", fontFamily: "var(--mono)", fontSize: "12px" }}>
              No posts found.
            </div>
          )}
        </div>

        <Pagination
          className="wri-pagination"
          page={page}
          totalItems={sorted.length}
          pageSize={WRITING_PAGE_SIZE}
          onPageChange={goToPage}
        />
      </div>
    </div>
  );
}
