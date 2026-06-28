"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";

const BRAND = "genuine.dev";
const SESSION_KEY = "brand-typed";

type CursorPhase = "typing" | "blinking" | "hidden";

interface TypewriterBrandProps {
  className?: string;
}

function renderBrand(count: number) {
  const visible = BRAND.slice(0, count);
  const nodes: ReactNode[] = [];

  for (let i = 0; i < visible.length; i++) {
    const ch = visible[i];
    if (ch === ".") {
      nodes.push(
        <span key={`dot-${i}`} className="brand-dot">
          {ch}
        </span>,
      );
    } else {
      nodes.push(<span key={`ch-${i}`}>{ch}</span>);
    }
  }

  return nodes;
}

/**
 * Types `genuine.dev` once per session with a blinking underscore cursor,
 * then leaves the completed wordmark (cursor fades after a short blink).
 */
export function TypewriterBrand({ className = "" }: TypewriterBrandProps) {
  const [count, setCount] = useState(0);
  const [cursorPhase, setCursorPhase] = useState<CursorPhase>("typing");
  const [skipAnimation, setSkipAnimation] = useState(false);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SESSION_KEY) === "1";
    if (reduced || seen) {
      setSkipAnimation(true);
      setCount(BRAND.length);
      setCursorPhase("hidden");
    }
  }, []);

  useEffect(() => {
    if (skipAnimation || count >= BRAND.length) {
      if (count >= BRAND.length && !skipAnimation && cursorPhase === "typing") {
        sessionStorage.setItem(SESSION_KEY, "1");
        setCursorPhase("blinking");
        const hide = window.setTimeout(() => setCursorPhase("hidden"), 2200);
        return () => window.clearTimeout(hide);
      }
      return;
    }

    const delay = count === 0 ? 420 : 58 + Math.floor(Math.random() * 34);
    const id = window.setTimeout(() => setCount((c) => c + 1), delay);
    return () => window.clearTimeout(id);
  }, [count, cursorPhase, skipAnimation]);

  const showCursor = cursorPhase !== "hidden";
  const cursorClass =
    cursorPhase === "blinking" ? "brand-cursor is-blinking" : "brand-cursor is-typing";

  return (
    <span
      className={`typewriter-brand${skipAnimation ? " is-complete" : ""}${className ? ` ${className}` : ""}`}
      suppressHydrationWarning
    >
      {renderBrand(count)}
      {showCursor && (
        <span className={cursorClass} aria-hidden>
          _
        </span>
      )}
    </span>
  );
}
