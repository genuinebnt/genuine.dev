"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialPosts.forEach((p) => {
      (p.metadata?.tags as string[] | undefined)?.forEach((t) => {
        counts[t] = (counts[t] ?? 0) + 1;
      });
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

  // Group by year (current page only)
  const byYear = useMemo(() => {
    const map = new Map<number, PostItem[]>();
    pagedPosts.forEach((p) => {
      const yr = p.date ? new Date(p.date).getFullYear() : 0;
      if (!map.has(yr)) map.set(yr, []);
      map.get(yr)!.push(p);
    });
    return [...map.entries()].sort(([a], [b]) => (sort === "newest" ? b - a : a - b));
  }, [pagedPosts, sort]);

  return (
    <div className="wri-shell">
      {/* Filter sidebar */}
      <div className="filter-col">
        <div className="fc-header">
          <div className="fc-eyebrow">Articles</div>
          <div className="fc-title">All posts</div>
        </div>
        <div className="fc-body">
          <div className="fc-search">
            <span style={{ color: "var(--faint)", fontFamily: "var(--mono)", fontSize: "11px" }}>⌕</span>
            <input
              placeholder="search…"
              value={q}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          <div className="filter-section">
            <div className="fs-h">topic</div>
            <div
              className={`filter-item${!activeTopic && !activeTag ? " wri-active" : ""}`}
              onClick={() => { setActiveTopic(null); setActiveTag(null); }}
            >
              <span className="fi-dot" style={{ background: "var(--muted)" }} />
              <span className="fi-label">all</span>
              <span className="fi-count">{initialPosts.length}</span>
            </div>
            {TOPIC_KEYS.filter((t) => topicCounts[t] !== undefined).map((t) => {
              const topicClass = topicCssClass(t);
              return (
              <div
                key={t}
                className={`filter-item${activeTopic === t ? " wri-active" : ""}`}
                onClick={() => { setActiveTopic(t); setActiveTag(null); }}
              >
                <span className={`fi-dot${topicClass ? ` ${topicClass}` : ""}`}
                  style={!topicClass ? { background: topicColor(t) } : undefined}
                />
                <span className="fi-label">{t}</span>
                <span className="fi-count">{topicCounts[t] ?? 0}</span>
              </div>
              );
            })}
          </div>

          {allTags.length > 0 && (
            <div className="filter-section">
              <div className="fs-h">tags</div>
              {allTags.map((tag) => (
                <div
                  key={tag}
                  className={`filter-item${activeTag === tag ? " wri-active" : ""}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  <span className="fi-dot" style={{ background: "var(--faint)" }} />
                  <span className="fi-label">{tag}</span>
                  <span className="fi-count">{tagCounts[tag] ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="fc-footer">
          <div className="sort-row">
            <span className="sort-label">sort</span>
            <div className="sort-opts">
              <span
                className={`sort-opt${sort === "newest" ? " sel" : ""}`}
                onClick={() => setSort("newest")}
              >
                newest
              </span>
              <span
                className={`sort-opt${sort === "oldest" ? " sel" : ""}`}
                onClick={() => setSort("oldest")}
              >
                oldest
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Post list column */}
      <div className="post-col">
        <div className="pc-header">
          <span className="pc-count">
            <span>{sorted.length}</span> posts
          </span>
          <span className="pc-sp" />
          <div className="view-toggle">
            <span className="vt-btn vt-active">≡ list</span>
          </div>
        </div>

        <div className="post-list">
          {byYear.map(([year, posts]) => (
            <div key={year}>
              <div className="year-row">
                <span className="yr-label">{year}</span>
                <span className="yr-line" />
                <span className="yr-count">{posts.length} posts</span>
              </div>
              {posts.map((p) => {
                const topic = deriveTopic(p.metadata as Record<string, unknown> | undefined);
                const cssClass = topicCssClass(topic);
                const color = topicColor(topic);
                const tags = (p.metadata?.tags as string[] | undefined) ?? [];
                return (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="wri-post-row">
                    <div className={`topic-bar${cssClass ? ` ${cssClass}` : ""}`}
                      style={!cssClass ? { background: color } : undefined}
                    />
                    <div className="wpr-body">
                      <div className="wpr-top">
                        <div className="wpr-title">{p.title}</div>
                        {isNew(p.date) && <span className="new-badge">new</span>}
                        <span className="wpr-date">{p.date}</span>
                      </div>
                      {p.summary && <div className="wpr-summary">{p.summary}</div>}
                      <div className="wpr-footer">
                        <div className="wpr-chips">
                          {tags.map((t) => (
                            <span key={t} className="wpr-chip">{t}</span>
                          ))}
                        </div>
                        <div className="wpr-meta">
                          <span className="wpr-read">{p.reading_min} min</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
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
