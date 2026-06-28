"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STORAGE,
  THEME_PRESETS,
  applyThemeForPath,
  clearSessionTheme,
  hasSessionTheme,
  isThemeKey,
  setSessionAccent,
  setSessionTheme,
  type ThemeKey,
} from "../../lib/theme";

const ACCENT_PRESETS = ["#00d4a4", "#f0703c", "#60a5fa", "#a78bfa", "#ef5350", "#f59e0b"] as const;

/** Effective theme/accent = session override (navbar) → permanent (admin) → default. */
function readEffectiveTheme(): { theme: ThemeKey; accent: string } {
  const stored =
    sessionStorage.getItem(STORAGE.sessionTheme) ?? localStorage.getItem(STORAGE.theme);
  const theme: ThemeKey = stored && isThemeKey(stored) ? stored : "dark";
  const accent =
    sessionStorage.getItem(STORAGE.sessionAccent) ??
    localStorage.getItem(STORAGE.accent) ??
    "#00d4a4";
  return { theme, accent };
}

/** Navbar theme + accent picker — applies a session-only override (resets next session). */
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
    clearSessionTheme();
    const saved = readEffectiveTheme();
    setActiveTheme(saved.theme);
    setActiveAccent(saved.accent);
    setIsPreviewing(false);
    onRestore?.();
  }, [onRestore]);

  useEffect(() => {
    const saved = readEffectiveTheme();
    setActiveTheme(saved.theme);
    setActiveAccent(saved.accent);
    setIsPreviewing(hasSessionTheme());
  }, []);

  useEffect(() => {
    applyThemeForPath(pathname);
  }, [pathname]);

  function pickTheme(theme: ThemeKey) {
    setActiveTheme(theme);
    setIsPreviewing(true);
    setSessionTheme(theme);
  }

  function pickAccent(hex: string) {
    setActiveAccent(hex);
    setIsPreviewing(true);
    setSessionAccent(hex);
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
