"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { searchPosts, getProjects, type PostItem } from "../lib/api";
import { deriveTopic, topicColor } from "../lib/topic";
import { projectCaseStudyHref } from "../lib/projectLinks";

type Action = { kind: "action"; id: string; label: string; icon: string };
type Item =
  | { kind: "post"; data: PostItem }
  | { kind: "project"; data: PostItem }
  | Action;

const STATIC_ACTIONS: Action[] = [
  { kind: "action", id: "theme", label: "Toggle theme", icon: "◑" },
  { kind: "action", id: "now", label: "Go to /now", icon: "↗" },
  { kind: "action", id: "uses", label: "Go to /uses", icon: "↗" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [projects, setProjects] = useState<PostItem[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load projects once on mount for instant project search.
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    // Also open via the nav badge click (dispatched by Nav.tsx).
    function onOpenEvent() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-cmdk", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-cmdk", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setPosts([]);
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!q.trim()) {
      setPosts([]);
      return;
    }
    let cancelled = false;
    searchPosts(q)
      .then((r) => { if (!cancelled) { setPosts(r); setSel(0); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [q]);

  const filteredProjects = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.summary?.toLowerCase().includes(lower) ||
        (p.metadata?.tags as string[] | undefined)?.some((t) => t.toLowerCase().includes(lower)),
    );
  }, [q, projects]);

  const filteredActions = useMemo(() => {
    if (!q.trim()) return STATIC_ACTIONS;
    const lower = q.toLowerCase();
    return STATIC_ACTIONS.filter((a) => a.label.toLowerCase().includes(lower));
  }, [q]);

  // Flat list for keyboard navigation.
  const allItems = useMemo((): Item[] => [
    ...posts.map((p): Item => ({ kind: "post", data: p })),
    ...filteredProjects.map((p): Item => ({ kind: "project", data: p })),
    ...filteredActions,
  ], [posts, filteredProjects, filteredActions]);

  const totalResults = allItems.length;

  function go(item: Item) {
    setOpen(false);
    if (item.kind === "post") { router.push(`/blog/${item.data.slug}`); return; }
    if (item.kind === "project") { router.push(projectCaseStudyHref(item.data.slug)); return; }
    if (item.id === "theme") {
      const cur = document.documentElement.getAttribute("data-theme");
      (window as any).__setTheme(cur === "dark" ? "light" : "dark");
      return;
    }
    if (item.id === "now") { router.push("/now"); return; }
    if (item.id === "uses") { router.push("/uses"); return; }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = allItems[sel];
      if (item) go(item);
    }
  }

  if (!open) return null;

  let globalIdx = 0;

  function ItemRow({ item }: { item: Item }) {
    const idx = globalIdx++;
    const isSel = idx === sel;

    if (item.kind === "post" || item.kind === "project") {
      const p = item.data;
      const topic = deriveTopic(p.metadata as Record<string, unknown> | undefined);
      const dotColor = topicColor(topic);
      const tags = (p.metadata?.tags as string[] | undefined) ?? [];
      const sub = [
        ...tags.slice(0, 2),
        p.reading_min ? `${p.reading_min} min read` : null,
      ].filter(Boolean).join(" · ");

      return (
        <div
          className={`cmdk-item${isSel ? " cmdk-sel" : ""}`}
          onMouseEnter={() => setSel(idx)}
          onClick={() => go(item)}
        >
          <div className="ci-icon">{item.kind === "post" ? "✎" : "⊞"}</div>
          <div className="ci-body">
            <div className="ci-title">{p.title}</div>
            {sub && <div className="ci-sub">{sub}</div>}
          </div>
          <div className="ci-topic-dot" style={{ background: dotColor }} />
          <span className="ci-type">{item.kind}</span>
        </div>
      );
    }

    return (
      <div
        className={`cmdk-item${isSel ? " cmdk-sel" : ""}`}
        onMouseEnter={() => setSel(idx)}
        onClick={() => go(item)}
      >
        <div className="ci-icon">{item.icon}</div>
        <div className="ci-body">
          <div className="ci-title">{item.label}</div>
        </div>
        <span className="ci-type">action</span>
      </div>
    );
  }

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="cmdk-ic">⌕</span>
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Search posts, projects, actions…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <span className="cmdk-esc" onClick={() => setOpen(false)}>esc</span>
        </div>

        <div className="cmdk-sections">
          {posts.length > 0 && (
            <>
              <div className="cmdk-group-label">posts</div>
              {posts.map((p) => <ItemRow key={p.slug} item={{ kind: "post", data: p }} />)}
            </>
          )}
          {filteredProjects.length > 0 && (
            <>
              <div className="cmdk-group-label">projects</div>
              {filteredProjects.map((p) => <ItemRow key={p.slug} item={{ kind: "project", data: p }} />)}
            </>
          )}
          {filteredActions.length > 0 && (
            <>
              <div className="cmdk-group-label">actions</div>
              {filteredActions.map((a) => <ItemRow key={a.id} item={a} />)}
            </>
          )}
          {allItems.length === 0 && q && (
            <div style={{ padding: "20px 16px", color: "var(--faint)", fontFamily: "var(--mono)", fontSize: "12px", textAlign: "center" }}>
              No results for &ldquo;{q}&rdquo;
            </div>
          )}
          {!q && (
            <div style={{ padding: "12px 16px", color: "var(--faint)", fontFamily: "var(--mono)", fontSize: "11px" }}>
              Type to search posts, projects, or actions…
            </div>
          )}
        </div>

        <div className="cmdk-footer">
          <span className="cmdk-hint"><span className="cmdk-key">↑↓</span> navigate</span>
          <span className="cmdk-hint"><span className="cmdk-key">↵</span> open</span>
          <span className="cmdk-hint"><span className="cmdk-key">esc</span> close</span>
          <span className="cmdk-footer-sp" />
          {totalResults > 0 && <span className="cmdk-results-count">{totalResults} results</span>}
        </div>
      </div>
    </div>
  );
}
