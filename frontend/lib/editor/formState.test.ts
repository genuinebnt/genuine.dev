import { describe, expect, it } from "vitest";
import type { EditDoc } from "../admin/types";
import {
  BLANK_DOC,
  buildDocMetadata,
  buildDocMetadataForPublish,
  fieldsFromDoc,
  isEditorDirty,
} from "./formState";

const BASE: EditDoc = {
  slug: "my-post",
  kind: "post",
  title: "My Post",
  summary: "Summary",
  status: "draft",
  body_markdown: "Body",
  cover_image: null,
  metadata: {
    topic: "rust",
    tags: ["rust"],
    scheduled_for: "2026-08-01T09:00:00.000Z",
  },
};

describe("fieldsFromDoc", () => {
  it("maps metadata into editor field strings", () => {
    const fields = fieldsFromDoc(BASE);
    expect(fields.tags).toBe("rust");
    expect(fields.topic).toBe("rust");
    expect(fields.scheduleAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe("isEditorDirty", () => {
  it("is clean when all fields match the loaded document", () => {
    expect(isEditorDirty(BASE, fieldsFromDoc(BASE))).toBe(false);
  });

  it("detects metadata-only edits", () => {
    const fields = fieldsFromDoc(BASE);
    expect(isEditorDirty(BASE, { ...fields, topic: "go" })).toBe(true);
    expect(isEditorDirty(BASE, { ...fields, tags: "rust, new-tag" })).toBe(true);
    expect(isEditorDirty(BASE, { ...fields, scheduleAt: "2026-09-01T10:00" })).toBe(true);
  });

  it("detects body and status changes", () => {
    const fields = fieldsFromDoc(BASE);
    expect(isEditorDirty(BASE, { ...fields, body: "Changed" })).toBe(true);
    expect(isEditorDirty(BASE, { ...fields, status: "published" })).toBe(true);
  });
});

describe("buildDocMetadata", () => {
  it("omits empty optional keys instead of storing blanks", () => {
    const md = buildDocMetadata(BASE.metadata, {
      featured: false,
      topic: "",
      seriesName: "",
      seriesPart: "1",
      tags: "",
      tech: "",
      kind: "post",
      scheduleAt: "",
    });
    expect(md.topic).toBeUndefined();
    expect(md.tags).toBeUndefined();
    expect(md.scheduled_for).toBeUndefined();
  });

  it("keeps tech on projects only", () => {
    const md = buildDocMetadata({}, {
      featured: false,
      topic: "",
      seriesName: "",
      seriesPart: "1",
      tags: "api",
      tech: "rust, axum",
      kind: "project",
      scheduleAt: "",
    });
    expect(md.tech).toEqual(["rust", "axum"]);
  });
});

describe("buildDocMetadataForPublish", () => {
  const fieldSlice = {
    featured: false,
    topic: "rust",
    seriesName: "",
    seriesPart: "1",
    tags: "rust",
    tech: "",
    kind: "post" as const,
    scheduleAt: "2026-08-01T09:00",
  };

  it("clears schedule when publishing now", () => {
    const md = buildDocMetadataForPublish(
      { scheduled_for: "2026-08-01T09:00:00.000Z" },
      fieldSlice,
      "now",
      "",
    );
    expect(md.scheduled_for).toBeUndefined();
    expect(md.topic).toBe("rust");
  });

  it("writes schedule date when publishing later", () => {
    const md = buildDocMetadataForPublish({}, fieldSlice, "schedule", "2026-09-15T08:00");
    expect(md.scheduled_for).toBe(new Date("2026-09-15T08:00").toISOString());
  });
});

describe("BLANK_DOC", () => {
  it("starts new editor sessions from a consistent empty shape", () => {
    expect(fieldsFromDoc(BLANK_DOC)).toMatchObject({
      title: "",
      slug: "",
      status: "draft",
      scheduleAt: "",
    });
  });
});
