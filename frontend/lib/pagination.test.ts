import { describe, expect, it } from "vitest";
import {
  clampPage,
  pageCount,
  pageRange,
  paginateSlice,
  parsePageParam,
} from "./pagination";

describe("paginateSlice", () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  it("returns the full list when it fits one page", () => {
    expect(paginateSlice(items, 1, 20)).toEqual(items);
  });

  it("slices by page and clamps out-of-range pages", () => {
    expect(paginateSlice(items, 2, 3)).toEqual([4, 5, 6]);
    expect(paginateSlice(items, 99, 3)).toEqual([7]);
  });
});

describe("pageCount and clampPage", () => {
  it("computes page totals and bounds", () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(21, 10)).toBe(3);
    expect(clampPage(0, 21, 10)).toBe(1);
    expect(clampPage(4, 21, 10)).toBe(3);
  });
});

describe("pageRange", () => {
  it("returns human-readable bounds", () => {
    expect(pageRange(2, 25, 10)).toEqual({ start: 11, end: 20 });
    expect(pageRange(1, 0, 10)).toEqual({ start: 0, end: 0 });
  });
});

describe("parsePageParam", () => {
  it("ignores invalid query values", () => {
    expect(parsePageParam(null)).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("2.9")).toBe(2);
  });
});
