"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Self-contained collapse control for a content sidebar rail. Place it as the
 * first child of the rail; it toggles `rail-collapsed` on the closest
 * `[data-rail-shell]` and persists the choice in localStorage. Works inside
 * server-rendered shells (post / about) as well as client ones (writing /
 * projects) because it drives the DOM class directly.
 */
export function RailToggle({
  storageKey,
  label = "sidebar",
}: {
  storageKey: string;
  label?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  const apply = (next: boolean) => {
    ref.current?.closest("[data-rail-shell]")?.classList.toggle("rail-collapsed", next);
  };

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) === "1";
    setCollapsed(stored);
    apply(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, next ? "1" : "0");
      apply(next);
      return next;
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      className="rail-toggle"
      onClick={toggle}
      title={collapsed ? `Show ${label}` : `Hide ${label}`}
      aria-label={collapsed ? `Show ${label}` : `Hide ${label}`}
      aria-expanded={!collapsed}
    >
      <span aria-hidden>{collapsed ? "›" : "‹"}</span>
    </button>
  );
}
