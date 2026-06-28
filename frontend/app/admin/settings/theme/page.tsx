"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PAGE_OVERRIDE_DEFS,
  STORAGE,
  type PageOverride,
  type PageOverrideKey,
  type ThemeKey,
  applyThemeForPath,
  isThemeKey,
  readPageOverrides,
  themeLabel,
  writePageOverrides,
} from "../../../../lib/theme";

// ── Theme preset definitions ──────────────────────────────────────────────────

const THEMES = [
  {
    key: "dark" as const,
    name: "Dark",
    bg: "#0d0f12",
    surface: "#13161b",
    border: "#232830",
    acc: "#00d4a4",
    dots: ["#00d4a4", "#60a5fa", "#a78bfa"],
  },
  {
    key: "light" as const,
    name: "Light",
    bg: "#f6f7f9",
    surface: "#ffffff",
    border: "#e4e8ee",
    acc: "#008f6f",
    dots: ["#008f6f", "#2563eb", "#7c3aed"],
  },
  {
    key: "midnight" as const,
    name: "Midnight",
    bg: "#0b0c1a",
    surface: "#12132a",
    border: "#242648",
    acc: "#7c8cff",
    dots: ["#7c8cff", "#5e9bff", "#b08cff"],
  },
  {
    key: "sepia" as const,
    name: "Sepia",
    bg: "#f4ecd8",
    surface: "#fbf5e6",
    border: "#e0d4b4",
    acc: "#9c6b1f",
    dots: ["#9c6b1f", "#3f6ea5", "#7a5aa0"],
  },
  {
    key: "matrix" as const,
    name: "Matrix",
    bg: "#040806",
    surface: "#0a120c",
    border: "#16271a",
    acc: "#22e06a",
    dots: ["#22e06a", "#22c8e0", "#7ce022"],
  },
];

const ACCENT_PRESETS = [
  { color: "#00d4a4", title: "NotiQ green (default)" },
  { color: "#f0703c", title: "rust orange" },
  { color: "#60a5fa", title: "blue" },
  { color: "#a78bfa", title: "purple" },
  { color: "#e879f9", title: "pink" },
  { color: "#ef5350", title: "red" },
  { color: "#f59e0b", title: "amber" },
];

function applyTheme(key: string) {
  window.__setTheme?.(key);
}

function applyAccent(hex: string) {
  window.__setAccent?.(hex);
}

function readStoredOverridesRaw(): Partial<Record<PageOverrideKey, PageOverride | null>> {
  try {
    const raw = localStorage.getItem(STORAGE.pageOverrides);
    return raw ? (JSON.parse(raw) as Partial<Record<PageOverrideKey, PageOverride | null>>) : {};
  } catch {
    return {};
  }
}

function displayOverride(key: PageOverrideKey, draft: Partial<Record<PageOverrideKey, PageOverride | null>>) {
  if (key in draft) {
    const val = draft[key];
    if (!val) return undefined;
    return val;
  }
  return readPageOverrides()[key];
}

export default function ThemeSettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("dark");
  const [accent, setAccent] = useState("#00d4a4");
  const [pageDraft, setPageDraft] = useState<Partial<Record<PageOverrideKey, PageOverride | null>>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE.theme) ?? "dark";
    const storedAccent = localStorage.getItem(STORAGE.accent) ?? "#00d4a4";
    if (isThemeKey(storedTheme)) setSelectedTheme(storedTheme);
    setAccent(storedAccent);
    setPageDraft(readStoredOverridesRaw());
  }, []);

  function pickTheme(key: ThemeKey) {
    setSelectedTheme(key);
    setSaved(false);
    applyTheme(key);
  }

  function pickAccent(hex: string) {
    setAccent(hex);
    setSaved(false);
    applyAccent(hex);
  }

  function customizePage(key: PageOverrideKey) {
    const next: PageOverride =
      key === "posts"
        ? { theme: selectedTheme, accent: "per-topic" }
        : { theme: selectedTheme, accent };
    setPageDraft((prev) => ({ ...prev, [key]: next }));
    setSaved(false);
  }

  function resetPage(key: PageOverrideKey) {
    setPageDraft((prev) => ({ ...prev, [key]: null }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(STORAGE.theme, selectedTheme);
    localStorage.setItem(STORAGE.accent, accent);
    writePageOverrides(pageDraft);
    applyThemeForPath(window.location.pathname);
    setSaved(true);
  }

  function discard() {
    const t = localStorage.getItem(STORAGE.theme) ?? "dark";
    const a = localStorage.getItem(STORAGE.accent) ?? "#00d4a4";
    const overrides = readStoredOverridesRaw();
    if (isThemeKey(t)) setSelectedTheme(t);
    setAccent(a);
    setPageDraft(overrides);
    applyTheme(t);
    applyAccent(a);
    applyThemeForPath(window.location.pathname);
    setSaved(false);
  }

  const themeObj = THEMES.find((t) => t.key === selectedTheme) ?? THEMES[0];
  const previewAccBg = accent + "18";
  const previewBorderColor = accent + "40";

  return (
    <div className="ts-admin-shell">
      <div className="ts-admin-nav">
        <div className="ts-an-section">
          <span className="ts-an-label">content</span>
          <Link href="/admin" className="ts-an-item">
            <span>✎</span> Posts
          </Link>
          <Link href="/admin?kind=project" className="ts-an-item">
            <span>⊞</span> Projects
          </Link>
          <Link href="/admin?status=scheduled" className="ts-an-item">
            <span>◷</span> Scheduled
          </Link>
        </div>
        <div className="ts-an-section">
          <span className="ts-an-label">site</span>
          <div className="ts-an-item ts-active">
            <span>◑</span> Theme
          </div>
          <div className="ts-an-item">
            <span>⚙</span> Settings
          </div>
        </div>
      </div>

      <div className="ts-main">
        <div className="ts-page-title">Theme</div>
        <div className="ts-page-sub">
          Controls appearance for all public-facing pages. Per-page overrides available below.
        </div>

        <div className="ts-sec-h">preset</div>
        <div className="ts-theme-grid">
          {THEMES.map((t) => (
            <div
              key={t.key}
              className={`ts-theme-card${selectedTheme === t.key ? " ts-selected" : ""}`}
              onClick={() => pickTheme(t.key)}
            >
              <div className="ts-tc-preview" style={{ background: t.bg }}>
                <div className="ts-tc-bar" style={{ background: t.acc }} />
                <div className="ts-tc-bar s" style={{ background: t.border }} />
                <div className="ts-tc-line" style={{ background: t.surface, width: "80%" }} />
                <div className="ts-tc-line" style={{ background: t.surface, width: "55%" }} />
                <div className="ts-tc-dots">
                  {t.dots.map((d, i) => (
                    <div key={i} className="ts-tc-dot" style={{ background: d }} />
                  ))}
                </div>
              </div>
              <div
                className="ts-tc-footer"
                style={{ background: t.surface, borderTop: `1px solid ${t.border}` }}
              >
                <span className="ts-tc-name">{t.name}</span>
                <span className="ts-tc-check">✓</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ts-sec-h">accent color</div>
        <div className="ts-accent-panel">
          <div className="ts-accent-row">
            <span className="ts-acc-label">presets</span>
            <div className="ts-acc-swatches">
              {ACCENT_PRESETS.map((p) => (
                <span
                  key={p.color}
                  className={`ts-acc-sw${accent === p.color ? " ts-active" : ""}`}
                  style={{ background: p.color }}
                  title={p.title}
                  onClick={() => pickAccent(p.color)}
                />
              ))}
              <div className="ts-color-wrap" title="Custom color">
                <input type="color" value={accent} onChange={(e) => pickAccent(e.target.value)} />
                <div className="ts-color-dot">+</div>
              </div>
            </div>
          </div>
          <div className="ts-accent-row">
            <span className="ts-acc-label">current</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: accent,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
                {accent}
              </span>
              <button
                className="ts-btn-lg ts-ghost"
                style={{ fontSize: "10px", padding: "2px 6px" }}
                onClick={() => pickAccent("#00d4a4")}
              >
                reset to default
              </button>
            </div>
          </div>
        </div>

        <div className="ts-sec-h">live preview</div>
        <div className="ts-preview-box">
          <div className="ts-pb-label">genuine.dev — public view</div>
          <div className="ts-pb-body" style={{ background: themeObj.bg }}>
            <div className="ts-pb-nav">
              <span
                className="ts-pb-pill"
                style={{
                  background: previewAccBg,
                  borderColor: previewBorderColor,
                  color: accent,
                }}
              >
                Articles
              </span>
              <span
                className="ts-pb-pill"
                style={{
                  borderColor: "transparent",
                  color: themeObj.bg === "#f6f7f9" ? "#5b6573" : "#6b7280",
                }}
              >
                Projects
              </span>
              <span
                className="ts-pb-pill"
                style={{
                  borderColor: "transparent",
                  color: themeObj.bg === "#f6f7f9" ? "#5b6573" : "#6b7280",
                }}
              >
                About
              </span>
            </div>
            <div className="ts-pb-eyebrow" style={{ color: accent }}>
              Rust · Systems · Infosec
            </div>
            <div
              className="ts-pb-h1"
              style={{ color: themeObj.bg === "#f6f7f9" ? "#1a1e25" : "#e2e6ee" }}
            >
              I build <span style={{ color: accent }}>systems</span> and write about how they break.
            </div>
            <div
              className="ts-pb-lead"
              style={{ color: themeObj.bg === "#f6f7f9" ? "#5b6573" : "#6b7280" }}
            >
              Backend and distributed systems engineer working mostly in Rust.
            </div>
            <div className="ts-pb-chips">
              <span
                className="ts-pb-chip"
                style={{ background: previewAccBg, borderColor: previewBorderColor, color: accent }}
              >
                active
              </span>
              <span
                className="ts-pb-chip"
                style={{
                  background: themeObj.surface,
                  borderColor: themeObj.border,
                  color: themeObj.bg === "#f6f7f9" ? "#5b6573" : "#6b7280",
                }}
              >
                Rust
              </span>
            </div>
          </div>
        </div>

        <div className="ts-sec-h">per-page overrides</div>
        <table className="ts-ov-table">
          <thead>
            <tr>
              <th>page</th>
              <th>base theme</th>
              <th>accent</th>
              <th style={{ textAlign: "right" }}>actions</th>
            </tr>
          </thead>
          <tbody>
            {PAGE_OVERRIDE_DEFS.map((def) => {
              const ov = displayOverride(def.key, pageDraft);
              const hasOverride = !!ov;
              const perTopic = ov?.accent === "per-topic";
              return (
                <tr key={def.key}>
                  <td>
                    <div className="ts-ot-page">{def.page}</div>
                    <div className="ts-ot-url">{def.url}</div>
                  </td>
                  <td>
                    {ov?.theme ? (
                      <span className="ts-theme-pill">{themeLabel(ov.theme)}</span>
                    ) : (
                      <span className="ts-theme-pill def">↳ site default</span>
                    )}
                  </td>
                  <td>
                    <div className="ts-ot-acc">
                      <div
                        className="ts-ot-dot"
                        style={{
                          background: perTopic ? "var(--purple)" : (ov?.accent ?? accent),
                          border: perTopic ? "1px dashed var(--border2)" : undefined,
                        }}
                      />
                      <span className="ts-ot-acc-label">
                        {perTopic ? "per-topic (auto)" : ov?.accent ?? "↳ site default"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="ts-ot-actions">
                      {hasOverride && (
                        <button type="button" className="ts-btn" onClick={() => resetPage(def.key)}>
                          reset
                        </button>
                      )}
                      <button
                        type="button"
                        className="ts-btn ts-edit"
                        onClick={() => customizePage(def.key)}
                      >
                        customize
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ts-save-bar">
          <span className="ts-save-bar-txt">
            {saved ? (
              "Theme saved."
            ) : (
              <>
                <strong>Unsaved changes</strong> — theme: {themeObj.name} · accent: {accent}
              </>
            )}
          </span>
          <button type="button" className="ts-btn-lg ts-ghost" onClick={discard}>
            Discard
          </button>
          <button type="button" className="ts-btn-lg ts-primary" onClick={save}>
            Save site theme
          </button>
        </div>
      </div>
    </div>
  );
}
