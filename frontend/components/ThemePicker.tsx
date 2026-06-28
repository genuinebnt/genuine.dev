"use client";

const PRESETS = ["dark", "light", "midnight", "sepia", "matrix"] as const;

declare global {
  interface Window {
    __setTheme?: (t: string) => void;
    __setAccent?: (h: string) => void;
    __resetAccent?: () => void;
  }
}

export default function ThemePicker() {
  return (
    <div className="theme-picker">
      {PRESETS.map((name) => (
        <button
          key={name}
          className={`tp-sw ${name}`}
          title={name}
          aria-label={`${name} theme`}
          onClick={() => window.__setTheme?.(name)}
        />
      ))}
      <label className="accent-pick" title="Custom accent">
        <span className="accent-dot" />
        <input
          type="color"
          defaultValue="#00d4a4"
          onChange={(e) => window.__setAccent?.(e.target.value)}
        />
      </label>
      <button
        className="accent-reset"
        title="Reset accent"
        onClick={() => window.__resetAccent?.()}
      >
        ⟲
      </button>
    </div>
  );
}
