"use client";

import { useEffect, useState } from "react";
import { STORAGE } from "../../lib/theme";

/** Collapsed rail — active accent indicator (full swatches in expanded tray). */
export function PolybarThemeCompact() {
  const [accent, setAccent] = useState("#00d4a4");

  useEffect(() => {
    const sync = () => {
      const css = getComputedStyle(document.documentElement).getPropertyValue("--acc").trim();
      const stored = localStorage.getItem(STORAGE.accent);
      setAccent(css || stored || "#00d4a4");
    };
    sync();
    window.addEventListener("storage", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => {
      window.removeEventListener("storage", sync);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="nav-tray-rail-cell nav-tray-theme-compact" title="Theme preview in tray">
      <span className="nav-tray-theme-dot" style={{ background: accent }} aria-hidden />
      <span className="nav-tray-rail-label">theme</span>
    </div>
  );
}
