"use client";

import { useState } from "react";
import { useScrollSpy } from "../../hooks/useScrollSpy";
import { scrollToHashTarget } from "../../lib/scrollRoot";

const SECTIONS = ["Languages", "Editor", "Terminal", "Stack", "Hardware", "Security"] as const;

const USES_SECTIONS = SECTIONS.map((label) => ({
  label,
  id: label.toLowerCase(),
}));

const USES = [
  {
    id: "Languages",
    color: "#f0703c",
    items: [
      { name: "Rust", desc: "Primary language for everything systems. axum, tokio, sqlx, tonic, crossbeam.", tag: "daily" },
      { name: "Python", desc: "LeetCode and scripting only. Not production.", tag: "weekly" },
      { name: "SQL", desc: "Postgres almost exclusively. Raw queries over ORMs.", tag: "daily" },
      { name: "TypeScript", desc: "Frontend — Next.js, React. Keeps JS sane enough.", tag: "active" },
    ],
  },
  {
    id: "Editor",
    color: "var(--blue)",
    items: [
      { name: "Neovim", desc: "rust-analyzer, nvim-cmp, telescope. Lua config in dotfiles.", tag: "daily" },
      { name: "Cursor", desc: "AI-native editor for frontend work and rapid prototyping.", tag: "active" },
      { name: "Helix", desc: "Backup editor. Kakoune-style selection model.", tag: "occasional" },
    ],
  },
  {
    id: "Terminal",
    color: "var(--blue)",
    items: [
      { name: "WezTerm", desc: "GPU-accelerated, Lua config, multiplexer built in.", tag: "daily" },
      { name: "fish", desc: "Abbreviations over aliases. starship prompt.", tag: "daily" },
      { name: "tmux", desc: "Session management on remote servers.", tag: "occasional" },
    ],
  },
  {
    id: "Stack",
    color: "var(--acc)",
    items: [
      { name: "axum", desc: "HTTP API layer. Tower middleware, clean ergonomics.", tag: "primary" },
      { name: "tokio", desc: "Async runtime. The entire ecosystem depends on it.", tag: "primary" },
      { name: "sqlx", desc: "Postgres client. Runtime-checked queries.", tag: "primary" },
      { name: "Next.js", desc: "App Router, SSR. Portfolio and blog frontend.", tag: "active" },
    ],
  },
  {
    id: "Hardware",
    color: "var(--purple)",
    items: [
      { name: "MacBook Pro M2", desc: "Apple Silicon. Static analysis only — can't run Linux ELFs natively.", tag: "primary" },
      { name: "Yamaha F310", desc: "Acoustic guitar. Learning fingerstyle alongside Hindi songs.", tag: "hobby" },
      { name: "AirPods Pro", desc: "Transparency mode while coding. Noise cancellation for deep work.", tag: "daily" },
    ],
  },
  {
    id: "Security",
    color: "var(--acc)",
    items: [
      { name: "Burp Suite", desc: "Pro. Intercept, scanner, repeater. Primary bounty tool.", tag: "active" },
      { name: "Ghidra", desc: "Static RE on Apple Silicon. C and x86-64 targets.", tag: "weekly" },
      { name: "oob-catcher", desc: "My own OOB interaction server. Wildcard DNS + HTTP logging.", tag: "self-built" },
      { name: "nmap", desc: "Network scanning and service fingerprinting.", tag: "active" },
    ],
  },
];

export default function UsesPage() {
  const [active, setActive] = useState<(typeof SECTIONS)[number]>("Languages");

  useScrollSpy(USES_SECTIONS, (label) => setActive(label as (typeof SECTIONS)[number]), "uses-scroll-root");

  return (
    <div className="uses-shell">
      {/* TOC sidebar — reuses now-toc styles */}
      <div className="now-toc">
        <div className="now-toc-h">sections</div>
        {SECTIONS.map((s) => (
          <a
            key={s}
            href={`#${s.toLowerCase()}`}
            className={`now-toc-link${active === s ? " now-cur" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setActive(s);
              const target = document.getElementById(s.toLowerCase());
              const root = document.getElementById("uses-scroll-root");
              if (target && root) scrollToHashTarget(root, target);
            }}
          >
            {s}
          </a>
        ))}
      </div>

      {/* Body */}
      <div id="uses-scroll-root" className="uses-body" data-scroll-root>
        <div className="now-eyebrow">Uses</div>
        <h1 className="now-h1" style={{ marginBottom: "4px" }}>What I use</h1>
        <div className="now-meta">The actual stack, not the aspirational one.</div>

        {USES.map((section) => (
          <div key={section.id} id={section.id.toLowerCase()}>
            <h2 className="uses-h2">
              <div className="uses-h2-bar" style={{ background: section.color }} />
              {section.id}
            </h2>
            {section.items.map((item) => (
              <div key={item.name} className="uses-item">
                <div className="ui-name">{item.name}</div>
                <div className="ui-desc">{item.desc}</div>
                <span className="ui-tag">{item.tag}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
