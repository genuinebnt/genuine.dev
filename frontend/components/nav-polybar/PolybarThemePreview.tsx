"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STORAGE,
  THEME_PRESETS,
  applyThemeForPath,
  isThemeKey,
  previewAccent,
  previewTheme,
  type ThemeKey,
} from "../../lib/theme";

const ACCENT_PRESETS = ["#00d4a4", "#f0703c", "#60a5fa", "#a78bfa", "#ef5350", "#f59e0b"] as const;

function readSavedTheme(): { theme: ThemeKey; accent: string } {
  const storedTheme = localStorage.getItem(STORAGE.theme);
  const theme: ThemeKey = storedTheme && isThemeKey(storedTheme) ? storedTheme : "dark";
  const accent = localStorage.getItem(STORAGE.accent) ?? "#00d4a4";
  return { theme, accent };
}

/** Theme + accent preview — does not persist (save in admin settings). */
export default function PolybarThemePreview({
  pathname,
  onRestore,
}: {
  pathname: string;
  onRestore?: () => void;
}) {
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("dark");
  const [activeAccent, setActiveAccent] = useState("#00d4a4");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const syncFromSaved = useCallback(() => {
    const saved = readSavedTheme();
    setActiveTheme(saved.theme);
    setActiveAccent(saved.accent);
    setIsPreviewing(false);
    applyThemeForPath(pathname);
    onRestore?.();
  }, [pathname, onRestore]);

  useEffect(() => {
    const saved = readSavedTheme();
    setActiveTheme(saved.theme);
    setActiveAccent(saved.accent);
  }, []);

  useEffect(() => {
    if (!isPreviewing) applyThemeForPath(pathname);
  }, [pathname, isPreviewing]);

  function pickTheme(theme: ThemeKey) {
    setActiveTheme(theme);
    setIsPreviewing(true);
    previewTheme(theme);
  }

  function pickAccent(hex: string) {
    setActiveAccent(hex);
    setIsPreviewing(true);
    previewAccent(hex);
  }

  return (
    <div className="nav-tray-widget nav-tray-theme">
      <div className="nav-tray-themes" role="group" aria-label="Theme preset">
        {THEME_PRESETS.map((name) => (
          <button
            key={name}
            type="button"
            className={`tp-sw ${name}${activeTheme === name ? " active" : ""}`}
            title={name}
            aria-label={`${name} theme`}
            aria-pressed={activeTheme === name}
            onClick={() => pickTheme(name)}
          />
        ))}
      </div>
      <span className="nav-tray-pipe" aria-hidden>
        |
      </span>
      <div className="nav-tray-accents" role="group" aria-label="Accent color">
        {ACCENT_PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            className={`nav-acc-sw${activeAccent.toLowerCase() === hex ? " active" : ""}`}
            style={{ background: hex }}
            title={hex}
            aria-label={`Accent ${hex}`}
            aria-pressed={activeAccent.toLowerCase() === hex}
            onClick={() => pickAccent(hex)}
          />
        ))}
        <label
          className={`accent-pick nav-accent-custom${
            !ACCENT_PRESETS.some((p) => p.toLowerCase() === activeAccent.toLowerCase()) ? " active" : ""
          }`}
          title="Custom accent"
        >
          <span className="accent-dot" style={{ background: activeAccent }} />
          <input
            type="color"
            value={activeAccent}
            onChange={(e) => pickAccent(e.target.value)}
            aria-label="Custom accent color"
          />
        </label>
      </div>
      <button
        type="button"
        className="ft-btn nav-tray-ic-btn nav-tray-reset"
        title="Restore saved theme"
        onClick={syncFromSaved}
        disabled={!isPreviewing}
        aria-label="Restore saved theme"
      >
        ⟲
      </button>
    </div>
  );
}
