"use client";

import { useEffect } from "react";
import mermaid from "mermaid";
import katex from "katex";
import "katex/dist/katex.min.css";
import { findScrollRoot, scrollToHashTarget } from "../lib/scrollRoot";

let mermaidReady = false;

function ensureMermaid() {
  if (mermaidReady) return;
  mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "strict" });
  mermaidReady = true;
}

async function renderMermaidBlocks(root: ParentNode) {
  const blocks = root.querySelectorAll<HTMLElement>("pre.mermaid");
  if (blocks.length === 0) return;
  ensureMermaid();
  try {
    await mermaid.run({ nodes: Array.from(blocks) });
  } catch (err) {
    console.error("Mermaid render failed", err);
  }
}

function renderMathBlocks(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".math-block[data-math]").forEach((el) => {
    if (el.dataset.rendered) return;
    const tex = el.textContent?.trim() ?? "";
    if (!tex) return;
    try {
      katex.render(tex, el, { displayMode: true, throwOnError: false });
      el.dataset.rendered = "1";
    } catch {
      /* keep raw text */
    }
  });

  root.querySelectorAll<HTMLElement>(".prose p, .panel-prose p").forEach((p) => {
    if (p.querySelector(".katex")) return;
    const html = p.innerHTML;
    if (!html.includes("$$") && !html.match(/(?<!\$)\$(?!\$)/)) return;
    let next = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex: string) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
      } catch {
        return `$$${tex}$$`;
      }
    });
    next = next.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_, tex: string) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `$${tex}$`;
      }
    });
    if (next !== html) p.innerHTML = next;
  });
}

function attachHeadingAnchors(proseRoot: HTMLElement) {
  const headings = proseRoot.querySelectorAll<HTMLElement>("h2, h3, h4");
  headings.forEach((h) => {
    if (h.querySelector(".heading-anchor")) return;
    const anchor = h.querySelector<HTMLAnchorElement>("a[id]");
    const id = anchor?.id ?? h.id;
    if (!id) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "heading-anchor";
    btn.setAttribute("aria-label", "Copy link to section");
    btn.textContent = "#";
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = "✓";
        setTimeout(() => {
          btn.textContent = "#";
        }, 1500);
      } catch {
        window.location.hash = id;
      }
    });
    h.classList.add("has-anchor");
    h.appendChild(btn);
  });
}

function attachImageLightbox(proseRoot: HTMLElement) {
  proseRoot.querySelectorAll<HTMLImageElement>(".prose img, .panel-prose img").forEach((img) => {
    if (img.closest(".code, .mermaid-wrap")) return;
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "img-lightbox";
      overlay.innerHTML = `<img src="${img.src}" alt="${img.alt || ""}" />`;
      overlay.addEventListener("click", () => overlay.remove());
      document.body.appendChild(overlay);
      document.body.classList.add("lightbox-open");
      overlay.addEventListener("click", () => document.body.classList.remove("lightbox-open"), { once: true });
    });
  });
}

function highlightCodeLineFromHash() {
  const raw = window.location.hash.replace(/^#/, "");
  const match = raw.match(/^L(\d+)$/i);
  if (!match) return;
  const lineNo = match[1];
  document.querySelectorAll<HTMLElement>(".code-line.hl-flash").forEach((el) => el.classList.remove("hl-flash"));
  const line = document.querySelector<HTMLElement>(`.code-line[data-line="${lineNo}"]`);
  if (!line) return;
  line.classList.add("hl-flash");
  line.scrollIntoView({ block: "center", behavior: "smooth" });
}

/**
 * Attaches client-side interactivity to server-rendered markdown HTML.
 */
export function DocInteractive() {
  useEffect(() => {
    const copyBtns = document.querySelectorAll<HTMLButtonElement>(".ccopy");
    const handleCopy = async (e: Event) => {
      const btn = e.currentTarget as HTMLButtonElement;
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

    const tabs = document.querySelectorAll<HTMLButtonElement>(".tab");
    const handleTabClick = (e: Event) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const wrap = btn.closest(".tabs-wrap");
      if (!wrap) return;
      const allTabs = Array.from(wrap.querySelectorAll(".tab"));
      const index = allTabs.indexOf(btn);
      if (index === -1) return;
      allTabs.forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      const panels = wrap.querySelectorAll(".tab-panel");
      panels.forEach((p) => p.classList.remove("active"));
      if (panels[index]) panels[index].classList.add("active");
    };
    tabs.forEach((tab) => tab.addEventListener("click", handleTabClick));

    const phases = document.querySelectorAll<HTMLDivElement>(".phase-header");
    const handlePhaseClick = (e: Event) => {
      const header = e.currentTarget as HTMLDivElement;
      const phase = header.closest(".phase");
      if (phase) phase.classList.toggle("open");
    };
    phases.forEach((phase) => phase.addEventListener("click", handlePhaseClick));

    const readingTarget = document.getElementById("reading-target");
    const proseRoot = readingTarget ?? document.querySelector<HTMLElement>(
      ".article-col, .about-body, .uses-body, .now-body, .article, .article-solo .article",
    );

    if (proseRoot) {
      attachHeadingAnchors(proseRoot);
      attachImageLightbox(proseRoot);
      void renderMermaidBlocks(proseRoot);
      renderMathBlocks(proseRoot);
      highlightCodeLineFromHash();
    }

    const onHash = () => highlightCodeLineFromHash();
    window.addEventListener("hashchange", onHash);

    if (!proseRoot) {
      return () => {
        copyBtns.forEach((btn) => btn.removeEventListener("click", handleCopy));
        tabs.forEach((tab) => tab.removeEventListener("click", handleTabClick));
        phases.forEach((phase) => phase.removeEventListener("click", handlePhaseClick));
        window.removeEventListener("hashchange", onHash);
      };
    }

    const scrollRoot = findScrollRoot(proseRoot);
    const observerRoot: Element | null = scrollRoot === window ? null : (scrollRoot as HTMLElement);
    const headings = proseRoot.querySelectorAll<HTMLElement>(".prose h2, .prose h3, h2, h3");
    const tocLinks = document.querySelectorAll<HTMLAnchorElement>(".toc a, .toc-link");

    const headingId = (h: HTMLElement) => h.querySelector("a[id]")?.id ?? h.id;

    const setCurrentLink = (id: string) => {
      tocLinks.forEach((link) => {
        link.classList.remove("cur", "active", "toc-cur");
        if (link.getAttribute("href") === `#${id}`) link.classList.add("cur", "toc-cur");
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
      { root: observerRoot, rootMargin: "-12% 0px -75% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));

    return () => {
      copyBtns.forEach((btn) => btn.removeEventListener("click", handleCopy));
      tabs.forEach((tab) => tab.removeEventListener("click", handleTabClick));
      phases.forEach((phase) => phase.removeEventListener("click", handlePhaseClick));
      tocLinks.forEach((link) => link.removeEventListener("click", handleTocClick));
      observer.disconnect();
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  return null;
}
