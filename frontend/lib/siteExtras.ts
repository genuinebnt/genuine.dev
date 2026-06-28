/** Client-only site extras: recent docs, reading prefs, status line, clock TZ. */

export const RECENT_DOCS_KEY = "recentDocs";
export const READING_PREFS_KEY = "readingPrefs";
export const STATUS_LINE_KEY = "siteStatusLine";
export const CLOCK_TZ_KEY = "polybarClockTz";
export const EDITOR_AUTOSAVE_PREFIX = "editor-autosave:";

export type RecentDoc = {
  slug: string;
  title: string;
  href: string;
  kind: "post" | "project" | "page";
  at: number;
};

export type ReadingPrefs = {
  proseWidth: "default" | "narrow" | "wide";
  fontScale: "default" | "large";
  focusMode: boolean;
};

const DEFAULT_READING_PREFS: ReadingPrefs = {
  proseWidth: "default",
  fontScale: "default",
  focusMode: false,
};

export function readRecentDocs(): RecentDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_DOCS_KEY);
    return raw ? (JSON.parse(raw) as RecentDoc[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentDoc(entry: Omit<RecentDoc, "at">) {
  const prev = readRecentDocs().filter((d) => d.href !== entry.href);
  const next = [{ ...entry, at: Date.now() }, ...prev].slice(0, 12);
  localStorage.setItem(RECENT_DOCS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("recent-docs-updated"));
}

export function readReadingPrefs(): ReadingPrefs {
  if (typeof window === "undefined") return DEFAULT_READING_PREFS;
  try {
    const raw = localStorage.getItem(READING_PREFS_KEY);
    return raw ? { ...DEFAULT_READING_PREFS, ...(JSON.parse(raw) as Partial<ReadingPrefs>) } : DEFAULT_READING_PREFS;
  } catch {
    return DEFAULT_READING_PREFS;
  }
}

export function writeReadingPrefs(prefs: Partial<ReadingPrefs>) {
  const next = { ...readReadingPrefs(), ...prefs };
  localStorage.setItem(READING_PREFS_KEY, JSON.stringify(next));
  applyReadingPrefs(next);
  window.dispatchEvent(new Event("reading-prefs-updated"));
}

export function applyReadingPrefs(prefs = readReadingPrefs()) {
  const root = document.documentElement;
  root.dataset.proseWidth = prefs.proseWidth;
  root.dataset.fontScale = prefs.fontScale;
  root.classList.toggle("focus-mode", prefs.focusMode);
}

export function readStatusLine(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STATUS_LINE_KEY) ?? "";
}

export function writeStatusLine(line: string) {
  localStorage.setItem(STATUS_LINE_KEY, line.trim());
  window.dispatchEvent(new Event("status-line-updated"));
}

export function readClockTz(): string {
  if (typeof window === "undefined") return Intl.DateTimeFormat().resolvedOptions().timeZone;
  return localStorage.getItem(CLOCK_TZ_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function writeClockTz(tz: string) {
  localStorage.setItem(CLOCK_TZ_KEY, tz);
  window.dispatchEvent(new Event("clock-tz-updated"));
}

export type EditorAutosavePayload = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  savedAt: number;
};

export function readEditorAutosave(key: string): EditorAutosavePayload | null {
  try {
    const raw = localStorage.getItem(EDITOR_AUTOSAVE_PREFIX + key);
    return raw ? (JSON.parse(raw) as EditorAutosavePayload) : null;
  } catch {
    return null;
  }
}

export function writeEditorAutosave(key: string, payload: EditorAutosavePayload) {
  localStorage.setItem(EDITOR_AUTOSAVE_PREFIX + key, JSON.stringify(payload));
}

export function clearEditorAutosave(key: string) {
  localStorage.removeItem(EDITOR_AUTOSAVE_PREFIX + key);
}
