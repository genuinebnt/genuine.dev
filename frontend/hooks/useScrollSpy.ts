"use client";

import { useEffect } from "react";
import { findScrollRoot } from "../lib/scrollRoot";

type Section = { id: string; label: string };

/**
 * Highlights the sidebar entry for whichever section heading is in view.
 * Panel pages scroll inside `[data-scroll-root]`, so the observer root must match.
 */
export function useScrollSpy(
  sections: Section[],
  setActive: (label: string) => void,
  scopeId?: string,
) {
  useEffect(() => {
    const scope = scopeId ? document.getElementById(scopeId) : document.querySelector("[data-scroll-root]");
    if (!(scope instanceof HTMLElement)) return;

    const scrollRoot = findScrollRoot(scope);
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el != null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        const current = visible.reduce((best, entry) =>
          entry.boundingClientRect.top < best.boundingClientRect.top ? entry : best,
        );

        const match = sections.find((section) => section.id === current.target.id);
        if (match) setActive(match.label);
      },
      {
        root: scrollRoot === window ? null : scrollRoot,
        rootMargin: "-12% 0px -75% 0px",
        threshold: 0,
      },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections, setActive, scopeId]);
}
