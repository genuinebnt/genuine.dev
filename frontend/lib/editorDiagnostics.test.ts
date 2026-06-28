import { describe, expect, it } from "vitest";
import {
  buildEditorDiagnostics,
  parseHeadings,
  parseOutlineBlocks,
  publishChecks,
} from "./editorDiagnostics";

const knownSlugs = new Set(["existing-post"]);

function diagInput(overrides: Partial<Parameters<typeof buildEditorDiagnostics>[0]> = {}) {
  return {
    title: "Title",
    slug: "new-post",
    summary: "Summary",
    tags: "rust",
    topic: "rust",
    body: "Intro paragraph.\n",
    knownSlugs,
    ...overrides,
  };
}

describe("parseHeadings", () => {
  it("flags headings with no body before the next section", () => {
    const md = "## Empty\n### Next\n\nParagraph.";
    const headings = parseHeadings(md);
    expect(headings.find((h) => h.text === "Empty")?.warn).toBe(true);
    expect(headings.find((h) => h.text === "Next")?.warn).toBeFalsy();
  });

  it("does not warn when a paragraph sits under the heading", () => {
    const md = "## Has body\n\nContent here.\n\n### Next";
    expect(parseHeadings(md).find((h) => h.text === "Has body")?.warn).toBeFalsy();
  });
});

describe("parseOutlineBlocks", () => {
  it("collects directives and opening code fences", () => {
    const md = ':::aside char "Note"\n```rust\nfn main() {}\n```';
    const blocks = parseOutlineBlocks(md);
    expect(blocks[0]).toMatchObject({ kind: "aside", label: expect.stringContaining("Note") });
    expect(blocks.some((b) => b.kind === "code" && b.label.includes("rust"))).toBe(true);
  });
});

describe("buildEditorDiagnostics", () => {
  it("warns on broken internal blog links", () => {
    const diags = buildEditorDiagnostics(
      diagInput({ body: "See [missing](/blog/missing-slug).\n" }),
    );
    expect(diags.some((d) => d.type === "warn" && d.msg.startsWith("broken link"))).toBe(true);
  });

  it("passes when internal slug exists", () => {
    const diags = buildEditorDiagnostics(
      diagInput({ body: "See [ok](/blog/existing-post).\n" }),
    );
    expect(diags.some((d) => d.msg === "all internal links resolve")).toBe(true);
  });

  it("warns on untagged code fences", () => {
    const diags = buildEditorDiagnostics(diagInput({ body: "```\ncode\n```\n" }));
    expect(diags.some((d) => d.msg.includes("missing language"))).toBe(true);
  });

  it("reports empty heading sections from a single parse pass", () => {
    const diags = buildEditorDiagnostics(diagInput({ body: "## Solo\n### Child\n\nText.\n" }));
    expect(diags.some((d) => d.msg.includes("no body content"))).toBe(true);
  });
});

describe("publishChecks", () => {
  it("surfaces warnings and a curated set of passed checks", () => {
    const diags = buildEditorDiagnostics(diagInput());
    const checks = publishChecks(diags);
    expect(checks.every((d) => d.type === "warn" || d.type === "ok")).toBe(true);
    expect(checks.some((d) => d.msg === "frontmatter valid")).toBe(true);
    expect(checks.some((d) => d.msg === "reading time estimated")).toBe(false);
  });
});
