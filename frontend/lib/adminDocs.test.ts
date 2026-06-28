import { describe, expect, it } from "vitest";
import type { AdminItem } from "./admin/types";
import {
  applyAdminSearch,
  adminRowAccent,
  adminRowDateDisplay,
  adminRowTopic,
  adminTagsInUse,
  applyScheduledMetadata,
  applyTagFilter,
  clearScheduledMetadata,
  effectiveStatus,
  filterAdminRows,
  filterFromSearchParams,
  scheduleInputFromMetadata,
  summarizeAdminStats,
} from "./adminDocs";

function row(overrides: Partial<AdminItem> = {}): AdminItem {
  return {
    slug: "hello-world",
    title: "Hello World",
    kind: "post",
    status: "draft",
    ...overrides,
  };
}

describe("effectiveStatus", () => {
  it("treats draft with scheduled_for as scheduled", () => {
    expect(
      effectiveStatus({
        status: "draft",
        metadata: { scheduled_for: "2026-07-01T12:00:00.000Z" },
      }),
    ).toBe("scheduled");
  });

  it("leaves plain drafts as draft", () => {
    expect(effectiveStatus({ status: "draft", metadata: {} })).toBe("draft");
  });

  it("ignores scheduled_for on published rows", () => {
    expect(
      effectiveStatus({
        status: "published",
        metadata: { scheduled_for: "2026-07-01T12:00:00.000Z" },
      }),
    ).toBe("published");
  });
});

describe("filterAdminRows", () => {
  const rows = [
    row({ slug: "a", kind: "post", status: "published" }),
    row({ slug: "b", kind: "project", status: "draft" }),
    row({
      slug: "c",
      status: "draft",
      metadata: { scheduled_for: "2026-08-01T09:00:00.000Z" },
    }),
  ];

  it("filters scheduled drafts without matching plain drafts", () => {
    expect(filterAdminRows(rows, "scheduled").map((r) => r.slug)).toEqual(["c"]);
    expect(filterAdminRows(rows, "drafts").map((r) => r.slug)).toEqual(["b"]);
  });
});

describe("summarizeAdminStats", () => {
  it("counts scheduled separately from drafts", () => {
    const stats = summarizeAdminStats([
      row({ status: "published" }),
      row({ status: "draft" }),
      row({ status: "draft", metadata: { scheduled_for: "2026-08-01T09:00:00.000Z" } }),
    ]);
    expect(stats).toMatchObject({ published: 1, drafts: 1, scheduled: 1, total: 3 });
  });
});

describe("schedule metadata helpers", () => {
  it("stores ISO scheduled_for from datetime-local input", () => {
    const next = applyScheduledMetadata({}, "2026-07-01T14:30");
    expect(next.scheduled_for).toBe(new Date("2026-07-01T14:30").toISOString());
  });

  it("clears scheduled_for when schedule input is empty", () => {
    const next = applyScheduledMetadata({ scheduled_for: "2026-07-01T12:00:00.000Z" }, "");
    expect(next.scheduled_for).toBeUndefined();
  });

  it("clearScheduledMetadata removes the key", () => {
    expect(clearScheduledMetadata({ scheduled_for: "x", topic: "rust" })).toEqual({ topic: "rust" });
  });

  it("scheduleInputFromMetadata returns empty for invalid values", () => {
    expect(scheduleInputFromMetadata({ scheduled_for: "not-a-date" })).toBe("");
    expect(scheduleInputFromMetadata({})).toBe("");
  });

  it("scheduleInputFromMetadata formats valid ISO for the editor input", () => {
    const formatted = scheduleInputFromMetadata({ scheduled_for: "2026-07-01T14:30:00.000Z" });
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe("filterFromSearchParams", () => {
  it("maps admin URL query params to list filters", () => {
    expect(filterFromSearchParams(new URLSearchParams("status=scheduled"))).toBe("scheduled");
    expect(filterFromSearchParams(new URLSearchParams("kind=project"))).toBe("projects");
    expect(filterFromSearchParams(new URLSearchParams(""))).toBeNull();
  });
});

describe("adminRowTopic", () => {
  it("uses explicit metadata.topic only", () => {
    expect(adminRowTopic({ metadata: { topic: "Rust", tags: ["go"] } })).toBe("rust");
    expect(adminRowTopic({ metadata: { tags: ["go"] } })).toBe("");
  });
});

describe("adminRowAccent", () => {
  it("derives bar color from first tag when topic is unset", () => {
    expect(adminRowAccent({ slug: "x", kind: "post", metadata: { tags: ["rust"] } }).cssClass).toBe(
      "t-rust",
    );
  });

  it("uses portfolio accent for static project slugs", () => {
    expect(adminRowAccent({ slug: "notiq", kind: "project", metadata: {} }).color).toBe(
      "var(--acc)",
    );
  });
});

describe("adminRowDateDisplay", () => {
  it("shows scheduled target in blue tone", () => {
    expect(
      adminRowDateDisplay({
        status: "draft",
        metadata: { scheduled_for: "2026-07-04T09:00:00.000Z" },
        published_at: null,
      }),
    ).toEqual({ label: "2026-07-04", tone: "scheduled" });
  });

  it("falls back to published_at", () => {
    expect(
      adminRowDateDisplay({
        status: "published",
        metadata: {},
        published_at: "2026-05-28",
      }),
    ).toEqual({ label: "2026-05-28", tone: "default" });
  });
});

describe("applyAdminSearch", () => {
  const rows = [
    row({ slug: "rust-async", title: "Async Rust", metadata: { tags: ["rust", "tokio"] } }),
    row({ slug: "go-notes", title: "Go notes", metadata: { tags: ["go"] } }),
  ];

  it("matches title, slug, and tag text", () => {
    expect(applyAdminSearch(rows, "async").map((r) => r.slug)).toEqual(["rust-async"]);
    expect(applyAdminSearch(rows, "tokio").map((r) => r.slug)).toEqual(["rust-async"]);
    expect(applyAdminSearch(rows, "  ")).toEqual(rows);
  });
});

describe("adminTagsInUse", () => {
  it("returns sorted unique tags from document metadata", () => {
    const tags = adminTagsInUse([
      row({ metadata: { tags: ["rust", "tokio"] } }),
      row({ slug: "b", metadata: { tags: ["rust"] } }),
      row({ slug: "c", metadata: {} }),
    ]);
    expect(tags).toEqual(["rust", "tokio"]);
  });
});

describe("applyTagFilter", () => {
  it("keeps rows that include the selected tag", () => {
    const rows = [
      row({ slug: "a", metadata: { tags: ["rust"] } }),
      row({ slug: "b", metadata: { tags: ["go"] } }),
    ];
    expect(applyTagFilter(rows, "rust").map((r) => r.slug)).toEqual(["a"]);
    expect(applyTagFilter(rows, null)).toEqual(rows);
  });
});
