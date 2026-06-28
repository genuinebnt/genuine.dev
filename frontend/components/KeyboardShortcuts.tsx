"use client";

import { useEffect, useState } from "react";

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "⌘ K", label: "Open command palette" },
  { keys: "?", label: "Show keyboard shortcuts" },
  { keys: "Esc", label: "Close overlays" },
  { keys: "↑ ↓", label: "Navigate palette results" },
  { keys: "↵", label: "Open selected palette item" },
  { keys: "⌘ S", label: "Save draft (editor)" },
  { keys: "⌘ ⇧ P", label: "Toggle preview (editor)" },
  { keys: "⌘ ⇧ L", label: "Focus mode toggle" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-kbd-help", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-kbd-help", onOpen);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="kbd-overlay" onClick={() => setOpen(false)} role="presentation">
      <div className="kbd-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts">
        <div className="kbd-head">
          <span className="kbd-title">Keyboard shortcuts</span>
          <button type="button" className="kbd-close" onClick={() => setOpen(false)} aria-label="Close">
            esc
          </button>
        </div>
        <div className="kbd-list">
          {SHORTCUTS.map((row) => (
            <div key={row.label} className="kbd-row">
              <span className="kbd-keys">{row.keys}</span>
              <span className="kbd-label">{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function openKeyboardShortcuts() {
  window.dispatchEvent(new CustomEvent("open-kbd-help"));
}
