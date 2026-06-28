import { describe, expect, it } from "vitest";
import { mergeScheduleValue, splitScheduleValue } from "./scheduleDateTime";

describe("scheduleDateTime", () => {
  it("splits datetime-local value into date and time", () => {
    expect(splitScheduleValue("2026-07-01T14:30")).toEqual({
      date: "2026-07-01",
      time: "14:30",
    });
  });

  it("returns empty parts for blank value", () => {
    expect(splitScheduleValue("")).toEqual({ date: "", time: "" });
  });

  it("merges date and time with default morning slot when time omitted", () => {
    expect(mergeScheduleValue("2026-07-01", "")).toBe("2026-07-01T09:00");
  });

  it("clears when date cleared", () => {
    expect(mergeScheduleValue("", "14:30")).toBe("");
  });
});
