import {
  defaultPolybarSettings,
  writePolybarSettings,
  type PolybarSettings,
} from "./polybar";

export type PolybarPresetId = "default" | "minimal" | "writer" | "demo";

export const POLYBAR_PRESETS: Record<
  PolybarPresetId,
  { label: string; description: string; apply: () => PolybarSettings }
> = {
  default: {
    label: "Default",
    description: "Clock, appearance, theme preview, timers, search.",
    apply: defaultPolybarSettings,
  },
  minimal: {
    label: "Minimal",
    description: "Search and light/dark only.",
    apply: () => {
      const base = defaultPolybarSettings();
      for (const id of Object.keys(base.widgets) as (keyof typeof base.widgets)[]) {
        base.widgets[id].enabled = id === "search" || id === "appearance";
        base.widgets[id].showCollapsed = id === "search" || id === "appearance";
      }
      return base;
    },
  },
  writer: {
    label: "Writer",
    description: "Pomodoro, countdown, search — focus timers up front.",
    apply: () => {
      const base = defaultPolybarSettings();
      const order = ["pomodoro", "countdown", "search", "appearance", "clock", "theme"];
      order.forEach((id, idx) => {
        const w = base.widgets[id as keyof typeof base.widgets];
        w.order = idx;
        w.enabled = ["pomodoro", "countdown", "search", "appearance"].includes(id);
        w.showCollapsed = ["pomodoro", "countdown", "search"].includes(id);
      });
      return base;
    },
  },
  demo: {
    label: "Demo",
    description: "All widgets visible in rail and tray.",
    apply: () => {
      const base = defaultPolybarSettings();
      for (const id of Object.keys(base.widgets) as (keyof typeof base.widgets)[]) {
        base.widgets[id].enabled = true;
        base.widgets[id].showCollapsed = true;
      }
      return base;
    },
  },
};

export function applyPolybarPreset(id: PolybarPresetId): PolybarSettings {
  const settings = POLYBAR_PRESETS[id].apply();
  writePolybarSettings(settings);
  return settings;
}
