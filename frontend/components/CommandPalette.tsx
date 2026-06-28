"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchPosts, type PostItem } from "../lib/api";

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PostItem[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (q.trim() === "") {
      setResults([]);
      return;
    }
    let cancelled = false;
    searchPosts(q)
      .then((r) => {
        if (!cancelled) {
          setResults(r);
          setSel(0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [q]);

  function go(i: number) {
    const p = results[i];
    if (p) {
      setOpen(false);
      router.push(`/blog/${p.slug}`);
    }
  }

  if (!open) return null;
  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="Search posts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, results.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              go(sel);
            }
          }}
        />
        <div className="cmdk-results">
          {results.map((p, i) => (
            <div
              key={p.slug}
              className={`cmdk-item${i === sel ? " sel" : ""}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => go(i)}
            >
              {p.title}
            </div>
          ))}
          {q && results.length === 0 && <div className="cmdk-empty">No results</div>}
        </div>
      </div>
    </div>
  );
}
