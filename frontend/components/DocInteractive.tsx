"use client";

import { useEffect } from "react";

/**
 * Attaches client-side interactivity to server-rendered markdown HTML.
 * Handles:
 * - Copy button on code blocks
 * - Tabs
 * - Accordions (Phases)
 * - Scroll-spy for TOC
 */
export function DocInteractive() {
  useEffect(() => {
    // 1. Copy Buttons
    const copyBtns = document.querySelectorAll<HTMLButtonElement>(".ccopy");
    const handleCopy = async (e: Event) => {
      const btn = e.currentTarget as HTMLButtonElement;
      // The raw source is stashed in `data-copy` so line numbers aren't copied.
      const code = btn.getAttribute("data-copy") ?? "";
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        const originalText = btn.innerText;
        btn.innerText = "copied!";
        setTimeout(() => {
          btn.innerText = originalText;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
    };
    copyBtns.forEach((btn) => btn.addEventListener("click", handleCopy));

    // 2. Tabs
    const tabs = document.querySelectorAll<HTMLButtonElement>(".tab");
    const handleTabClick = (e: Event) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const wrap = btn.closest(".tabs-wrap");
      if (!wrap) return;

      // Find index of clicked tab
      const allTabs = Array.from(wrap.querySelectorAll(".tab"));
      const index = allTabs.indexOf(btn);
      if (index === -1) return;

      // Update tabs
      allTabs.forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");

      // Update panels
      const panels = wrap.querySelectorAll(".tab-panel");
      panels.forEach((p) => p.classList.remove("active"));
      if (panels[index]) {
        panels[index].classList.add("active");
      }
    };
    tabs.forEach((tab) => tab.addEventListener("click", handleTabClick));

    // 3. Accordions
    const phases = document.querySelectorAll<HTMLDivElement>(".phase-header");
    const handlePhaseClick = (e: Event) => {
      const header = e.currentTarget as HTMLDivElement;
      const phase = header.closest(".phase");
      if (phase) {
        phase.classList.toggle("open");
      }
    };
    phases.forEach((phase) => phase.addEventListener("click", handlePhaseClick));

    // 4. Scroll-spy TOC. comrak puts the id on an anchor inside each heading.
    const headings = document.querySelectorAll<HTMLElement>(".prose h2, .prose h3");
    const tocLinks = document.querySelectorAll<HTMLAnchorElement>(".toc a");

    const headingId = (h: HTMLElement) => h.querySelector("a[id]")?.id ?? h.id;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = headingId(entry.target as HTMLElement);
            tocLinks.forEach((link) => {
              link.classList.remove("cur", "active");
              if (link.getAttribute("href") === `#${id}`) {
                link.classList.add("cur");
              }
            });
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    headings.forEach((h) => observer.observe(h));

    return () => {
      copyBtns.forEach((btn) => btn.removeEventListener("click", handleCopy));
      tabs.forEach((tab) => tab.removeEventListener("click", handleTabClick));
      phases.forEach((phase) => phase.removeEventListener("click", handlePhaseClick));
      observer.disconnect();
    };
  }, []);

  return null;
}
