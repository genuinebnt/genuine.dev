/** Split/combine `datetime-local` values (`YYYY-MM-DDTHH:mm`) for styled date + time inputs. */

export function splitScheduleValue(value: string): { date: string; time: string } {
  if (!value.trim()) return { date: "", time: "" };
  const [date, time = ""] = value.split("T");
  return { date: date ?? "", time: time.slice(0, 5) };
}

export function mergeScheduleValue(date: string, time: string): string {
  const d = date.trim();
  if (!d) return "";
  const t = time.trim() || "09:00";
  return `${d}T${t}`;
}
