"use client";

import { THEME_PRESETS, previewAccent, previewTheme, type ThemeKey } from "../lib/theme";

/** Compact preview-only picker (legacy export). Prefer NavThemeTray on public pages. */
export default function ThemePicker() {
  return (
    <div className="theme-picker">
      {THEME_PRESETS.map((name) => (
        <button
          key={name}
          type="button"
          className={`tp-sw ${name}`}
          title={name}
          aria-label={`${name} theme`}
          onClick={() => previewTheme(name as ThemeKey)}
        />
      ))}
      <label className="accent-pick" title="Custom accent">
        <span className="accent-dot" />
        <input
          type="color"
          defaultValue="#00d4a4"
          onChange={(e) => previewAccent(e.target.value)}
        />
      </label>
    </div>
  );
}
