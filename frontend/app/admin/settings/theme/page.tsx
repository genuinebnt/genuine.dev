"use client";

import { useEffect, useState } from "react";
import AdminSettingsShell from "../../../../components/admin/AdminSettingsShell";
import {
  PAGE_OVERRIDE_DEFS,
  STORAGE,
  type PageOverride,
  type PageOverrideKey,
  type ThemeKey,
  applyThemeForPath,
  isThemeKey,
  persistSiteTheme,
  previewAccent,
  previewTheme,
  readPageOverrides,
  themeLabel,
  writePageOverrides,
  exportThemeBundle,
  importThemeBundle,
  type ThemeBundle,
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

function applyThemePreview(key: ThemeKey) {
  previewTheme(key);
}

function applyAccentPreview(hex: string) {
  previewAccent(hex);
}

type SavedSnapshot = {
  theme: ThemeKey;
  accent: string;
  overrides: Partial<Record<PageOverrideKey, PageOverride | null>>;
};

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
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot | null>(null);
  const [saved, setSaved] = useState(false);
  const [editingOverride, setEditingOverride] = useState<PageOverrideKey | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE.theme) ?? "dark";
    const storedAccent = localStorage.getItem(STORAGE.accent) ?? "#00d4a4";
    const overrides = readStoredOverridesRaw();
    const theme: ThemeKey = isThemeKey(storedTheme) ? storedTheme : "dark";
    setSelectedTheme(theme);
    setAccent(storedAccent);
    setPageDraft(overrides);
    setSavedSnapshot({ theme, accent: storedAccent, overrides });
    applyThemePreview(theme);
    applyAccentPreview(storedAccent);
  }, []);

  function pickTheme(key: ThemeKey) {
    setSelectedTheme(key);
    setSaved(false);
    applyThemePreview(key);
  }

  function pickAccent(hex: string) {
    setAccent(hex);
    setSaved(false);
    applyAccentPreview(hex);
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
    persistSiteTheme(selectedTheme, accent);
    writePageOverrides(pageDraft);
    setSavedSnapshot({ theme: selectedTheme, accent, overrides: pageDraft });
    applyThemeForPath(window.location.pathname);
    window.dispatchEvent(new Event("theme-updated"));
    setSaved(true);
  }

  function discard() {
    if (!savedSnapshot) return;
    setSelectedTheme(savedSnapshot.theme);
    setAccent(savedSnapshot.accent);
    setPageDraft(savedSnapshot.overrides);
    persistSiteTheme(savedSnapshot.theme, savedSnapshot.accent);
    writePageOverrides(savedSnapshot.overrides);
    applyThemePreview(savedSnapshot.theme);
    applyAccentPreview(savedSnapshot.accent);
    applyThemeForPath(window.location.pathname);
    setSaved(true);
  }

  function exportTheme() {
    const bundle = exportThemeBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "genuine-theme.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importTheme() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const bundle = JSON.parse(String(reader.result)) as ThemeBundle;
          importThemeBundle(bundle);
          const theme: ThemeKey = isThemeKey(bundle.theme) ? bundle.theme : "dark";
          setSelectedTheme(theme);
          setAccent(bundle.accent);
          setPageDraft(bundle.pageOverrides ?? {});
          setSavedSnapshot({ theme, accent: bundle.accent, overrides: bundle.pageOverrides ?? {} });
          applyThemePreview(theme);
          applyAccentPreview(bundle.accent);
          setSaved(true);
        } catch {
          alert("Invalid theme file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function saveOverrideModal() {
    if (!editingOverride) return;
    customizePage(editingOverride);
    setEditingOverride(null);
  }

  const themeObj = THEMES.find((t) => t.key === selectedTheme) ?? THEMES[0];
  const previewAccBg = accent + "18";
  const previewBorderColor = accent + "40";

  return (
    <AdminSettingsShell active="theme">
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
                        onClick={() => setEditingOverride(def.key)}
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
          <button type="button" className="ts-btn-lg ts-ghost" onClick={exportTheme}>
            Export JSON
          </button>
          <button type="button" className="ts-btn-lg ts-ghost" onClick={importTheme}>
            Import JSON
          </button>
          <button type="button" className="ts-btn-lg ts-ghost" onClick={discard}>
            Discard
          </button>
          <button type="button" className="ts-btn-lg ts-primary" onClick={save}>
            Save site theme
          </button>
        </div>

        {editingOverride && (
          <div className="ts-override-modal" onClick={() => setEditingOverride(null)}>
            <div className="ts-override-panel" onClick={(e) => e.stopPropagation()}>
              <div className="ts-page-title" style={{ fontSize: "15px" }}>
                Override — {PAGE_OVERRIDE_DEFS.find((d) => d.key === editingOverride)?.page}
              </div>
              <p className="ts-page-sub">Uses current preset and accent selections for this page.</p>
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button type="button" className="ts-btn-lg ts-ghost" onClick={() => setEditingOverride(null)}>
                  Cancel
                </button>
                <button type="button" className="ts-btn-lg ts-primary" onClick={saveOverrideModal}>
                  Apply override
                </button>
              </div>
            </div>
          </div>
        )}
    </AdminSettingsShell>
  );
}
