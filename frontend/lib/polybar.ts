/** Admin-controlled polybar widget registry (persisted in localStorage). */

export const POLYBAR_STORAGE_KEY = "polybarSettings";

export const POLYBAR_WIDGETS = {
  clock: {
    label: "Clock",
    description: "Live time and date (timezone in Settings)",
    tray: true,
  },
  status: {
    label: "Status line",
    description: "Short status text from Settings",
    tray: true,
  },
  appearance: {
    label: "Light / dark",
    description: "Quick preview toggle between light and dark",
    tray: true,
  },
  theme: {
    label: "Theme preview",
    description: "Preset swatches and accent colors (preview only)",
    tray: true,
  },
  pomodoro: {
    label: "Pomodoro",
    description: "25 / 5 minute focus timer",
    tray: true,
  },
  countdown: {
    label: "Countdown",
    description: "Custom countdown timer",
    tray: true,
  },
  search: {
    label: "Search",
    description: "⌕ opens command palette (⌘K shortcut)",
    tray: false,
  },
  notifications: {
    label: "Notifications",
    description: "Scheduled publishes and admin alerts (login required)",
    tray: false,
  },
} as const;

export type PolybarWidgetId = keyof typeof POLYBAR_WIDGETS;

export type PolybarWidgetConfig = {
  enabled: boolean;
  order: number;
  /** Show compact control in the collapsed nav rail (default on when enabled). */
  showCollapsed: boolean;
};

export type PolybarSettings = {
  widgets: Record<PolybarWidgetId, PolybarWidgetConfig>;
};

const DEFAULT_ORDER: PolybarWidgetId[] = [
  "clock",
  "status",
  "appearance",
  "theme",
  "pomodoro",
  "countdown",
  "notifications",
  "search",
];

export function defaultPolybarSettings(): PolybarSettings {
  const widgets = {} as Record<PolybarWidgetId, PolybarWidgetConfig>;
  DEFAULT_ORDER.forEach((id, order) => {
    widgets[id] = { enabled: true, order, showCollapsed: true };
  });
  return { widgets };
}

export function readPolybarSettings(): PolybarSettings {
  if (typeof window === "undefined") return defaultPolybarSettings();
  try {
    const raw = localStorage.getItem(POLYBAR_STORAGE_KEY);
    if (!raw) return defaultPolybarSettings();
    const parsed = JSON.parse(raw) as Partial<PolybarSettings>;
    const base = defaultPolybarSettings();
    for (const id of DEFAULT_ORDER) {
      const row = parsed.widgets?.[id];
      if (row) {
        base.widgets[id] = {
          enabled: Boolean(row.enabled),
          order: typeof row.order === "number" ? row.order : base.widgets[id].order,
          showCollapsed: row.showCollapsed !== false,
        };
      }
    }
    return base;
  } catch {
    return defaultPolybarSettings();
  }
}

export function writePolybarSettings(settings: PolybarSettings) {
  localStorage.setItem(POLYBAR_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("polybar-config-updated"));
}

export function trayWidgetIds(settings: PolybarSettings): PolybarWidgetId[] {
  return DEFAULT_ORDER.filter(
    (id) => POLYBAR_WIDGETS[id].tray && settings.widgets[id]?.enabled,
  ).sort((a, b) => settings.widgets[a].order - settings.widgets[b].order);
}

export function collapsedWidgetIds(settings: PolybarSettings): PolybarWidgetId[] {
  return DEFAULT_ORDER.filter((id) => {
    const row = settings.widgets[id];
    if (!row?.enabled || row.showCollapsed === false) return false;
    return POLYBAR_WIDGETS[id].tray || id === "search" || id === "notifications";
  }).sort((a, b) => settings.widgets[a].order - settings.widgets[b].order);
}

export function openSiteSearch() {
  window.dispatchEvent(new CustomEvent("open-cmdk"));
}

export function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
