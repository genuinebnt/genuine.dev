"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { findScrollRoot } from "../lib/scrollRoot";

function progressForElementScroll(scrollEl: HTMLElement): number {
  const max = scrollEl.scrollHeight - scrollEl.clientHeight;
  if (max <= 0) return 100;
  return Math.min(100, Math.max(0, (scrollEl.scrollTop / max) * 100));
}

function progressForWindowScroll(target: HTMLElement): number {
  const rect = target.getBoundingClientRect();
  const viewport = window.innerHeight;
  const total = target.offsetHeight - viewport;

  if (total <= 0) {
    if (rect.bottom <= viewport) return 100;
    if (rect.top <= 0) return 50;
    return 0;
  }

  const scrolled = -rect.top;
  return Math.min(100, Math.max(0, (scrolled / total) * 100));
}

function computeProgress(targetId: string): number {
  const el = document.getElementById(targetId);
  if (!el) return 0;

  const scrollRoot = findScrollRoot(el);
  if (scrollRoot === window) return progressForWindowScroll(el);
  return progressForElementScroll(scrollRoot as HTMLElement);
}

/**
 * Thin fixed bar at the top of the viewport that fills left→right as the
 * reader scrolls through the target element (typically the article body).
 *
 * Portaled to `document.body` so panel shells (`overflow: hidden`) do not clip it.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const targetProgressRef = useRef(0);
  const displayedRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [ariaValue, setAriaValue] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function paintBar(value: number) {
      barRef.current?.style.setProperty("--read-progress", String(value / 100));
    }

    function step() {
      const goal = targetProgressRef.current;
      const current = displayedRef.current;
      const next = reducedMotion ? goal : current + (goal - current) * 0.18;

      displayedRef.current = Math.abs(goal - next) < 0.05 ? goal : next;
      paintBar(displayedRef.current);

      if (Math.abs(goal - displayedRef.current) > 0.05) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setAriaValue(Math.round(goal));
      }
    }

    function queuePaint() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(step);
    }

    function update() {
      targetProgressRef.current = computeProgress(targetId);
      queuePaint();
    }

    function bindScrollListener() {
      const el = document.getElementById(targetId);
      if (!el) return () => {};

      const scrollRoot = findScrollRoot(el);
      const onScroll = () => update();

      if (scrollRoot === window) {
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
      }

      scrollRoot.addEventListener("scroll", onScroll, { passive: true });
      return () => scrollRoot.removeEventListener("scroll", onScroll);
    }

    update();
    let unbindScroll = bindScrollListener();

    const onResize = () => {
      unbindScroll();
      unbindScroll = bindScrollListener();
      displayedRef.current = computeProgress(targetId);
      targetProgressRef.current = displayedRef.current;
      paintBar(displayedRef.current);
      setAriaValue(Math.round(displayedRef.current));
    };

    window.addEventListener("resize", onResize, { passive: true });

    const ro = new ResizeObserver(update);
    ro.observe(target);
    const scrollRoot = findScrollRoot(target);
    if (scrollRoot !== window) ro.observe(scrollRoot as HTMLElement);

    return () => {
      unbindScroll();
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, targetId]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="read-progress"
      role="progressbar"
      aria-valuenow={ariaValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div ref={barRef} className="read-progress-bar" />
    </div>,
    document.body,
  );
}
