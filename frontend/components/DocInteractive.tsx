"use client";

import { useEffect } from "react";
import { findScrollRoot, scrollToHashTarget } from "../lib/scrollRoot";

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

    // 4. Scroll-spy TOC — panel pages scroll inside `[data-scroll-root]`, not the window.
    const readingTarget = document.getElementById("reading-target");
    const proseRoot = readingTarget ?? document.querySelector<HTMLElement>(
      ".article-col, .about-body, .uses-body, .now-body",
    );
    if (!proseRoot) {
      return () => {
        copyBtns.forEach((btn) => btn.removeEventListener("click", handleCopy));
        tabs.forEach((tab) => tab.removeEventListener("click", handleTabClick));
        phases.forEach((phase) => phase.removeEventListener("click", handlePhaseClick));
      };
    }

    const scrollRoot = findScrollRoot(proseRoot);
    const observerRoot: Element | null =
      scrollRoot === window ? null : (scrollRoot as HTMLElement);
    const headings = proseRoot.querySelectorAll<HTMLElement>(".prose h2, .prose h3, h2, h3");
    const tocLinks = document.querySelectorAll<HTMLAnchorElement>(".toc a, .toc-link");

    const headingId = (h: HTMLElement) => h.querySelector("a[id]")?.id ?? h.id;

    const setCurrentLink = (id: string) => {
      tocLinks.forEach((link) => {
        link.classList.remove("cur", "active", "toc-cur");
        if (link.getAttribute("href") === `#${id}`) {
          link.classList.add("cur", "toc-cur");
        }
      });
    };

    const handleTocClick = (e: Event) => {
      const link = e.currentTarget as HTMLAnchorElement;
      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;

      const target = document.getElementById(href.slice(1));
      if (!target) return;

      if (scrollRoot !== window) {
        e.preventDefault();
        scrollToHashTarget(scrollRoot, target);
        setCurrentLink(target.id);
      }
    };
    tocLinks.forEach((link) => link.addEventListener("click", handleTocClick));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        const current = visible.reduce((best, entry) =>
          entry.boundingClientRect.top < best.boundingClientRect.top ? entry : best,
        );
        const id = headingId(current.target as HTMLElement);
        if (id) setCurrentLink(id);
      },
      {
        root: observerRoot,
        rootMargin: "-12% 0px -75% 0px",
        threshold: 0,
      },
    );

    headings.forEach((h) => observer.observe(h));

    return () => {
      copyBtns.forEach((btn) => btn.removeEventListener("click", handleCopy));
      tabs.forEach((tab) => tab.removeEventListener("click", handleTabClick));
      phases.forEach((phase) => phase.removeEventListener("click", handlePhaseClick));
      tocLinks.forEach((link) => link.removeEventListener("click", handleTocClick));
      observer.disconnect();
    };
  }, []);

  return null;
}
