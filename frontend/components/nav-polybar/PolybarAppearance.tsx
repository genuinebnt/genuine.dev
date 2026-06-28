"use client";

import { useEffect, useState } from "react";
import { previewTheme, type ThemeKey } from "../../lib/theme";

function isLightTheme(): boolean {
  return document.documentElement.getAttribute("data-theme") === "light";
}

function useAppearanceMode() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const sync = () => setLight(isLightTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next: ThemeKey = light ? "dark" : "light";
    setLight(!light);
    previewTheme(next);
  }

  return { light, mode: light ? "light" : "dark", toggle };
}

export function PolybarAppearanceCompact() {
  const { light, mode, toggle } = useAppearanceMode();

  return (
    <div className="nav-tray-rail-cell nav-tray-appearance">
      <button
        type="button"
        className="nav-tray-mode-btn nav-tray-mode-btn-compact"
        onClick={toggle}
        title={`Switch to ${light ? "dark" : "light"} (preview)`}
        aria-label={`Appearance: ${mode}. Switch to ${light ? "dark" : "light"}.`}
        aria-pressed={light}
      >
        <span className="nav-tray-mode-ic" aria-hidden>
          {light ? "◐" : "◑"}
        </span>
        <span className="nav-tray-mode-lbl">{mode}</span>
      </button>
    </div>
  );
}

/** Preview-only light/dark flip — persist via admin theme settings. */
export default function PolybarAppearance() {
  const { light, mode, toggle } = useAppearanceMode();

  return (
    <div className="nav-tray-widget nav-tray-appearance">
      <button
        type="button"
        className="nav-tray-mode-btn"
        onClick={toggle}
        title={`Switch to ${light ? "dark" : "light"} (preview)`}
        aria-label={`Appearance: ${mode}. Switch to ${light ? "dark" : "light"}.`}
        aria-pressed={light}
      >
        <span className="nav-tray-mode-ic" aria-hidden>
          {light ? "◐" : "◑"}
        </span>
        <span className="nav-tray-mode-lbl">{mode}</span>
      </button>
    </div>
  );
}
