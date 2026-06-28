"use client";

import Link from "next/link";
import { useEffect } from "react";

const SUGGESTIONS = [
  {
    color: "#f0703c",
    title: "Writing a lock-free queue from scratch",
    sub: "rust · performance · 12 min",
    href: "/blog/lock-free-queue",
    url: "writing/lock-free-queue",
  },
  {
    color: "var(--acc)",
    title: "NotiQ — Distributed Notification Platform",
    sub: "project · case study",
    href: "/projects/notiq",
    url: "projects/notiq",
  },
  {
    color: "var(--blue)",
    title: "Blind SSRF: building your own OOB server",
    sub: "infosec · bug-bounty · 9 min",
    href: "/blog/blind-ssrf",
    url: "writing/blind-ssrf",
  },
];

export default function NotFound() {
  useEffect(() => {
    document.title = "404 — genuine.dev";
  }, []);

  function openCmdK() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  }

  return (
    <div className="e404-shell">
      <div className="e404-inner">
        <div className="e404-code">
          <span>4</span>0<span>4</span>
        </div>
        <div className="e404-title">Nothing here.</div>
        <p className="e404-lead">
          The page you&rsquo;re looking for doesn&rsquo;t exist, was moved, or is still being written.
          Happens to the best of us.
        </p>
        <div className="e404-divider" />
        <div className="e404-label">you might be looking for</div>
        <div className="e404-links">
          {SUGGESTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="e404-link">
              <div className="ell-bar" style={{ background: s.color }} />
              <div>
                <div className="ell-title">{s.title}</div>
                <div style={{ fontSize: "11px", color: "var(--faint)" }}>{s.sub}</div>
              </div>
              <span className="ell-url">{s.url}</span>
            </Link>
          ))}
        </div>
        <div className="e404-search" role="button" onClick={openCmdK} style={{ cursor: "pointer" }}>
          <span className="e404-search-ic">⌕</span>
          <input readOnly placeholder="search the site…" style={{ cursor: "pointer" }} />
          <span className="e404-search-hint">or press ⌘K</span>
        </div>
      </div>
    </div>
  );
}
