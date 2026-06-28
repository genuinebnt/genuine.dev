import { describe, expect, it } from "vitest";
import {
  addMonths,
  calendarGrid,
  formatScheduleDisplay,
  parseIsoDate,
  toIsoDate,
  yearGridStart,
  yearGridYears,
} from "./calendar";

describe("calendar", () => {
  it("round-trips iso dates", () => {
    expect(parseIsoDate("2026-07-01")).toEqual({ year: 2026, month: 7, day: 1 });
    expect(toIsoDate(2026, 7, 1)).toBe("2026-07-01");
  });

  it("rejects invalid iso dates", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull();
  });

  it("addMonths crosses year boundary", () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("calendarGrid pads to six weeks", () => {
    expect(calendarGrid(2026, 6, 1)).toHaveLength(42);
  });

  it("formatScheduleDisplay includes time", () => {
    expect(formatScheduleDisplay("2026-07-01T14:30")).toContain("14:30");
  });

  it("yearGridStart aligns to 12-year pages", () => {
    expect(yearGridStart(2026)).toBe(2025);
    expect(yearGridYears(2025)).toEqual([
      2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036,
    ]);
  });
});
