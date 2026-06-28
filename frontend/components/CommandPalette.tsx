"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchPosts, getProjects, getPosts, type PostItem } from "../lib/api";
import { getToken } from "../lib/auth";
import { docMetadata } from "../lib/metadata";
import { deriveTopic, topicColor } from "../lib/topic";
import { projectCaseStudyHref } from "../lib/projectLinks";
import { readRecentDocs, writeReadingPrefs, readReadingPrefs, type RecentDoc } from "../lib/siteExtras";

type Action = { kind: "action"; id: string; label: string; icon: string };
type TagHit = { kind: "tag"; tag: string; count: number };
type PaletteItem =
  | { kind: "post"; data: PostItem }
  | { kind: "project"; data: PostItem }
  | { kind: "recent"; data: RecentDoc }
  | TagHit
  | Action;

type IndexedItem = PaletteItem & { index: number };

const STATIC_ACTIONS: Action[] = [
  { kind: "action", id: "theme", label: "Toggle theme", icon: "◑" },
  { kind: "action", id: "focus", label: "Toggle focus mode", icon: "◎" },
  { kind: "action", id: "copy-url", label: "Copy current URL", icon: "⎘" },
  { kind: "action", id: "shortcuts", label: "Keyboard shortcuts", icon: "?" },
  { kind: "action", id: "blog", label: "Go to Articles", icon: "✎" },
  { kind: "action", id: "now", label: "Go to /now", icon: "↗" },
  { kind: "action", id: "uses", label: "Go to /uses", icon: "↗" },
  { kind: "action", id: "admin", label: "Open admin", icon: "✦" },
  { kind: "action", id: "filter-rust", label: "Filter articles: rust", icon: "⊞" },
  { kind: "action", id: "filter-infosec", label: "Filter articles: infosec", icon: "⊞" },
];

function buildSections(groups: { label: string; items: PaletteItem[] }[]): {
  sections: { label: string; items: IndexedItem[] }[];
  allItems: IndexedItem[];
} {
  const visible = groups.filter((g) => g.items.length > 0);
  let cursor = 0;
  const sections = visible.map((g) => {
    const items = g.items.map((item) => ({ ...item, index: cursor++ }));
    return { label: g.label, items };
  });
  return { sections, allItems: sections.flatMap((s) => s.items) };
}

function CmdkItemRow({
  item,
  selected,
  onSelect,
  onGo,
}: {
  item: IndexedItem;
  selected: boolean;
  onSelect: (index: number) => void;
  onGo: (item: PaletteItem) => void;
}) {
  if (item.kind === "post" || item.kind === "project") {
    const p = item.data;
    const topic = deriveTopic(docMetadata(p));
    const tags = (p.metadata?.tags as string[] | undefined) ?? [];
    const sub = [...tags.slice(0, 2), p.reading_min ? `${p.reading_min} min read` : null]
      .filter(Boolean)
      .join(" · ");

    return (
      <div
        className={`cmdk-item${selected ? " cmdk-sel" : ""}`}
        onMouseEnter={() => onSelect(item.index)}
        onClick={() => onGo(item)}
      >
        <div className="ci-icon">{item.kind === "post" ? "✎" : "⊞"}</div>
        <div className="ci-body">
          <div className="ci-title">{p.title}</div>
          {sub && <div className="ci-sub">{sub}</div>}
        </div>
        <div className="ci-topic-dot" style={{ background: topicColor(topic) }} />
        <span className="ci-type">{item.kind}</span>
      </div>
    );
  }

  if (item.kind === "recent") {
    return (
      <div
        className={`cmdk-item${selected ? " cmdk-sel" : ""}`}
        onMouseEnter={() => onSelect(item.index)}
        onClick={() => onGo(item)}
      >
        <div className="ci-icon">↺</div>
        <div className="ci-body">
          <div className="ci-title">{item.data.title}</div>
          <div className="ci-sub">{item.data.href}</div>
        </div>
        <span className="ci-type">recent</span>
      </div>
    );
  }

  if (item.kind === "tag") {
    return (
      <div
        className={`cmdk-item${selected ? " cmdk-sel" : ""}`}
        onMouseEnter={() => onSelect(item.index)}
        onClick={() => onGo(item)}
      >
        <div className="ci-icon cmdk-tag-icon">#</div>
        <div className="ci-body">
          <div className="ci-title">{item.tag}</div>
          <div className="ci-sub">{item.count} post{item.count === 1 ? "" : "s"}</div>
        </div>
        <span className="ci-type">tag</span>
      </div>
    );
  }

  return (
    <div
      className={`cmdk-item${selected ? " cmdk-sel" : ""}`}
      onMouseEnter={() => onSelect(item.index)}
      onClick={() => onGo(item)}
    >
      <div className="ci-icon">{item.icon}</div>
      <div className="ci-body">
        <div className="ci-title">{item.label}</div>
      </div>
      <span className="ci-type">action</span>
    </div>
  );
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [allPosts, setAllPosts] = useState<PostItem[]>([]);
  const [projects, setProjects] = useState<PostItem[]>([]);
  const [recent, setRecent] = useState<RecentDoc[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProjects().then(setProjects).catch(() => {});
    getPosts().then(setAllPosts).catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenEvent() {
      setOpen(true);
    }
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
      setRecent(readRecentDocs());
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const sync = () => setRecent(readRecentDocs());
    window.addEventListener("recent-docs-updated", sync);
    return () => window.removeEventListener("recent-docs-updated", sync);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setPosts([]);
      return;
    }
    let cancelled = false;
    searchPosts(q)
      .then((r) => {
        if (!cancelled) {
          setPosts(r);
          setSel(0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [q]);

  const filteredProjects = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.summary?.toLowerCase().includes(lower) ||
        ((p.metadata?.tags as string[] | undefined) ?? []).some((t) => t.toLowerCase().includes(lower)),
    );
  }, [q, projects]);

  const filteredActions = useMemo(() => {
    const base = STATIC_ACTIONS.filter((a) => a.id !== "admin" || getToken());
    if (!q.trim()) return base;
    const lower = q.toLowerCase();
    return base.filter((a) => a.label.toLowerCase().includes(lower));
  }, [q]);

  const filteredRecent = useMemo(() => (q.trim() ? [] : recent.slice(0, 6)), [q, recent]);

  const filteredTags = useMemo((): TagHit[] => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    const counts = new Map<string, number>();
    for (const p of allPosts) {
      for (const tag of (p.metadata?.tags as string[] | undefined) ?? []) {
        if (tag.toLowerCase().includes(lower)) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 8)
      .map(([tag, count]) => ({ kind: "tag" as const, tag, count }));
  }, [q, allPosts]);

  const { sections, allItems } = useMemo(
    () =>
      buildSections([
        { label: "recent", items: filteredRecent.map((d) => ({ kind: "recent" as const, data: d })) },
        { label: "posts", items: posts.map((p) => ({ kind: "post" as const, data: p })) },
        { label: "projects", items: filteredProjects.map((p) => ({ kind: "project" as const, data: p })) },
        { label: "tags", items: filteredTags },
        { label: "actions", items: filteredActions },
      ]),
    [filteredRecent, posts, filteredProjects, filteredTags, filteredActions],
  );

  function go(item: PaletteItem) {
    setOpen(false);
    if (item.kind === "post") {
      router.push(`/blog/${item.data.slug}`);
      return;
    }
    if (item.kind === "project") {
      router.push(projectCaseStudyHref(item.data.slug));
      return;
    }
    if (item.kind === "recent") {
      router.push(item.data.href);
      return;
    }
    if (item.kind === "tag") {
      router.push(`/blog?tag=${encodeURIComponent(item.tag)}`);
      return;
    }
    if (item.id === "theme") {
      const cur = document.documentElement.getAttribute("data-theme");
      (window as Window & { __setTheme?: (t: string) => void }).__setTheme?.(cur === "dark" ? "light" : "dark");
      return;
    }
    if (item.id === "focus") {
      const prefs = readReadingPrefs();
      writeReadingPrefs({ focusMode: !prefs.focusMode });
      return;
    }
    if (item.id === "copy-url") {
      void navigator.clipboard.writeText(window.location.href);
      return;
    }
    if (item.id === "shortcuts") {
      window.dispatchEvent(new CustomEvent("open-kbd-help"));
      return;
    }
    if (item.id === "blog") {
      router.push("/blog");
      return;
    }
    if (item.id === "now") {
      router.push("/now");
      return;
    }
    if (item.id === "uses") {
      router.push("/uses");
      return;
    }
    if (item.id === "admin") {
      router.push("/admin");
      return;
    }
    if (item.id === "filter-rust") {
      router.push("/blog?topic=rust");
      return;
    }
    if (item.id === "filter-infosec") {
      router.push("/blog?topic=infosec");
    }
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
          <span className="cmdk-esc" onClick={() => setOpen(false)}>
            esc
          </span>
        </div>

        <div className="cmdk-sections">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="cmdk-group-label">{section.label}</div>
              {section.items.map((item) => (
                <CmdkItemRow
                  key={`${section.label}-${item.index}`}
                  item={item}
                  selected={sel === item.index}
                  onSelect={setSel}
                  onGo={go}
                />
              ))}
            </div>
          ))}
          {allItems.length === 0 && q && (
            <div className="cmdk-empty">No results for &ldquo;{q}&rdquo;</div>
          )}
          {!q && allItems.length === 0 && (
            <div className="cmdk-empty">Type to search, or pick an action below.</div>
          )}
        </div>

        <div className="cmdk-footer">
          <span className="cmdk-hint">
            <span className="cmdk-key">↑↓</span> navigate
          </span>
          <span className="cmdk-hint">
            <span className="cmdk-key">↵</span> open
          </span>
          <span className="cmdk-hint">
            <span className="cmdk-key">?</span> shortcuts
          </span>
          <span className="cmdk-footer-sp" />
          {allItems.length > 0 && <span className="cmdk-results-count">{allItems.length} results</span>}
        </div>
      </div>
    </div>
  );
}
