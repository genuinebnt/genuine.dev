/** Small calendar helpers for the schedule picker (local dates, no TZ math). */

const DISPLAY = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function toIsoDate(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function weekdaySundayZero(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function monthShort(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

export const MONTHS_SHORT = Array.from({ length: 12 }, (_, i) => monthShort(i + 1));

/** First year shown in the 12-year grid containing `year`. */
export function yearGridStart(year: number): number {
  return Math.floor((year - 1) / 12) * 12 + 9;
}

export function yearGridYears(start: number): number[] {
  return Array.from({ length: 12 }, (_, i) => start + i);
}

/** 42 cells (6 weeks): `null` = padding, number = day of month. */
export function calendarGrid(year: number, month: number): (number | null)[] {
  const firstDow = weekdaySundayZero(year, month, 1);
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

export function formatScheduleDisplay(value: string): string {
  const [datePart, timePart = ""] = value.split("T");
  const parsed = datePart ? parseIsoDate(datePart) : null;
  if (!parsed) return "";
  const { year, month, day } = parsed;
  const dateStr = DISPLAY.format(new Date(year, month - 1, day));
  const time = timePart.slice(0, 5);
  return time ? `${dateStr} · ${time}` : dateStr;
}

export function todayIso(): { year: number; month: number; day: number; iso: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return { year, month, day, iso: toIsoDate(year, month, day) };
}
