"use client";

import { useEffect, useState } from "react";
import AdminSettingsShell from "../../../../components/admin/AdminSettingsShell";
import UiPillToggle from "../../../../components/ui/UiPillToggle";
import {
  POLYBAR_PRESETS,
  applyPolybarPreset,
  type PolybarPresetId,
} from "../../../../lib/polybarPresets";
import {
  POLYBAR_WIDGETS,
  defaultPolybarSettings,
  readPolybarSettings,
  writePolybarSettings,
  type PolybarSettings,
  type PolybarWidgetId,
} from "../../../../lib/polybar";

const ORDER: PolybarWidgetId[] = ["clock", "status", "appearance", "theme", "pomodoro", "countdown", "notifications", "search"];

export default function PolybarSettingsPage() {
  const [draft, setDraft] = useState<PolybarSettings>(defaultPolybarSettings);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setDraft(readPolybarSettings());
  }, []);

  function toggle(id: PolybarWidgetId) {
    setDraft((d) => ({
      ...d,
      widgets: {
        ...d.widgets,
        [id]: { ...d.widgets[id], enabled: !d.widgets[id].enabled },
      },
    }));
    setSaved(false);
  }

  function toggleRail(id: PolybarWidgetId) {
    setDraft((d) => ({
      ...d,
      widgets: {
        ...d.widgets,
        [id]: { ...d.widgets[id], showCollapsed: !d.widgets[id].showCollapsed },
      },
    }));
    setSaved(false);
  }

  function move(id: PolybarWidgetId, dir: -1 | 1) {
    setDraft((d) => {
      const sorted = [...ORDER].sort((a, b) => d.widgets[a].order - d.widgets[b].order);
      const idx = sorted.indexOf(id);
      const swap = sorted[idx + dir];
      if (!swap) return d;
      const next = { ...d, widgets: { ...d.widgets } };
      const aOrder = next.widgets[id].order;
      next.widgets[id] = { ...next.widgets[id], order: next.widgets[swap].order };
      next.widgets[swap] = { ...next.widgets[swap], order: aOrder };
      return next;
    });
    setSaved(false);
  }

  function save() {
    writePolybarSettings(draft);
    setSaved(true);
  }

  function resetDefaults() {
    const defaults = defaultPolybarSettings();
    setDraft(defaults);
    writePolybarSettings(defaults);
    setSaved(true);
  }

  function applyPreset(id: PolybarPresetId) {
    setDraft(applyPolybarPreset(id));
    setSaved(true);
  }

  const sorted = [...ORDER].sort((a, b) => draft.widgets[a].order - draft.widgets[b].order);

  return (
    <AdminSettingsShell active="polybar">
        <div className="ts-page-title">Polybar widgets</div>
        <div className="ts-page-sub">
          Enabled widgets appear in the polybar pill by default; expand for full controls. Search is a ⌕
          circle inside the bar (⌘K shortcut only). Theme preview and light/dark toggles do not persist for
          visitors — save site theme separately.
        </div>

        <div className="ts-sec-h">presets</div>
        <div className="polybar-presets">
          {(Object.keys(POLYBAR_PRESETS) as PolybarPresetId[]).map((id) => (
            <button key={id} type="button" className="ts-btn-lg ts-ghost" onClick={() => applyPreset(id)}>
              {POLYBAR_PRESETS[id].label}
            </button>
          ))}
        </div>

        <table className="ts-ov-table polybar-admin-table">
          <thead>
            <tr>
              <th>widget</th>
              <th>shown in</th>
              <th>rail</th>
              <th>order</th>
              <th>enabled</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((id) => {
              const meta = POLYBAR_WIDGETS[id];
              const row = draft.widgets[id];
              return (
                <tr key={id}>
                  <td>
                    <div className="ts-ot-page">{meta.label}</div>
                    <div className="ts-ot-url">{meta.description}</div>
                  </td>
                  <td>
                    <span className="ts-theme-pill">{meta.tray ? "tray" : "polybar"}</span>
                  </td>
                  <td>
                    <UiPillToggle
                      on={row.showCollapsed}
                      onToggle={() => toggleRail(id)}
                      disabled={!row.enabled}
                      aria-label={`Rail for ${meta.label}`}
                    />
                  </td>
                  <td>
                    <div className="polybar-order-btns">
                      <button type="button" className="ts-btn" onClick={() => move(id, -1)} aria-label="Move up">
                        ↑
                      </button>
                      <button type="button" className="ts-btn" onClick={() => move(id, 1)} aria-label="Move down">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <UiPillToggle
                      on={row.enabled}
                      onToggle={() => toggle(id)}
                      aria-label={`Enable ${meta.label}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ts-save-bar">
          <span className="ts-save-bar-txt">{saved ? "Settings saved." : "Unsaved changes"}</span>
          <button type="button" className="ts-btn-lg ts-ghost" onClick={resetDefaults}>
            Reset defaults
          </button>
          <button type="button" className="ts-btn-lg ts-primary" onClick={save}>
            Save polybar
          </button>
        </div>
    </AdminSettingsShell>
  );
}
