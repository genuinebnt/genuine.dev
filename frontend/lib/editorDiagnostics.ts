/** Markdown analysis for the admin editor — outline, diagnostics, publish checks. */

import { readingMinutes, wordCount } from "./readingStats";

export type EditorDiag = {
  type: "warn" | "ok" | "info";
  msg: string;
  sub: string;
  lineNum?: number;
  fixLabel?: string;
  headingText?: string;
};

export type OutlineHeading = {
  level: number;
  text: string;
  lineNum: number;
  warn?: boolean;
};

export type OutlineBlock = {
  kind: "aside" | "callout" | "code";
  label: string;
  lineNum: number;
};

type ParsedMarkdown = {
  lines: string[];
  headings: OutlineHeading[];
  blocks: OutlineBlock[];
  emptyHeadingLines: Set<number>;
};

function parseMarkdown(md: string): ParsedMarkdown {
  const lines = md.split("\n");
  const emptyHeadingLines = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#{2,3}\s+(.+)$/);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j >= lines.length) continue;
    const next = lines[j];
    // Treat the next heading or directive as "no body" — matches author expectation in outline.
    if (/^#{1,3}\s/.test(next) || /^:::/.test(next)) emptyHeadingLines.add(i + 1);
  }

  const headings: OutlineHeading[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,3})\s+(.+)$/);
    if (!m) continue;
    const lineNum = i + 1;
    headings.push({
      level: m[1].length,
      text: m[2].trim(),
      lineNum,
      warn: emptyHeadingLines.has(lineNum),
    });
  }

  const blocks: OutlineBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const aside = line.match(/^:::aside\s+(\S+)\s+"([^"]+)"/);
    if (aside) {
      blocks.push({ kind: "aside", label: `aside · ${aside[2]}`, lineNum: i + 1 });
      continue;
    }
    const callout = line.match(/^:::callout\s+(\S+)\s+"([^"]+)"/);
    if (callout) {
      blocks.push({ kind: "callout", label: `callout · ${callout[2]}`, lineNum: i + 1 });
      continue;
    }
    const fence = line.match(/^```(\w+)?/);
    if (fence) {
      blocks.push({ kind: "code", label: `code · ${fence[1] ?? "plain"}`, lineNum: i + 1 });
    }
  }

  return { lines, headings, blocks, emptyHeadingLines };
}

export function parseHeadings(md: string): OutlineHeading[] {
  return parseMarkdown(md).headings;
}

export function parseOutlineBlocks(md: string): OutlineBlock[] {
  return parseMarkdown(md).blocks;
}

function internalLinks(lines: string[]): { href: string; lineNum: number }[] {
  const links: { href: string; lineNum: number }[] = [];
  const re = /\[([^\]]*)\]\(([^)]+)\)/g;
  lines.forEach((line, i) => {
    for (const m of line.matchAll(re)) {
      const href = m[2].trim();
      if (href.startsWith("/") && !href.startsWith("//")) {
        links.push({ href, lineNum: i + 1 });
      }
    }
  });
  return links;
}

function slugFromInternalHref(href: string): string | null {
  const blog = href.match(/^\/blog\/([^/?#]+)/);
  if (blog) return blog[1];
  const proj = href.match(/^\/projects\/([^/?#]+)/);
  if (proj) return proj[1];
  return null;
}

function untaggedFenceLines(lines: string[]): number[] {
  const out: number[] = [];
  lines.forEach((line, i) => {
    if (/^```\s*$/.test(line)) out.push(i + 1);
  });
  return out;
}

export function buildEditorDiagnostics(input: {
  title: string;
  slug: string;
  summary: string;
  tags: string;
  topic: string;
  body: string;
  knownSlugs: Set<string>;
  slugTaken?: boolean;
}): EditorDiag[] {
  const issues: EditorDiag[] = [];
  const tagList = input.tags
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const words = wordCount(input.body);
  const readMin = readingMinutes(words);
  const parsed = parseMarkdown(input.body);
  const headingByLine = new Map(parsed.headings.map((h) => [h.lineNum, h]));

  if (!input.title.trim()) {
    issues.push({ type: "warn", msg: "title missing", sub: "Add a title to the post." });
  } else {
    issues.push({ type: "ok", msg: "title present", sub: input.title.trim() });
  }

  if (!input.slug.trim()) {
    issues.push({
      type: "warn",
      msg: "slug empty",
      sub: "Will be auto-generated from title on save.",
    });
  } else if (input.slugTaken) {
    issues.push({
      type: "warn",
      msg: "slug may collide",
      sub: `${input.slug} already exists — save will update that document.`,
    });
  } else {
    issues.push({ type: "ok", msg: "slug available", sub: input.slug });
  }

  if (!input.summary.trim()) {
    issues.push({ type: "warn", msg: "summary missing", sub: "Add a summary for the post card." });
  } else {
    issues.push({ type: "ok", msg: "summary present", sub: `${input.summary.trim().slice(0, 60)}…` });
  }

  if (!tagList.length) {
    issues.push({ type: "warn", msg: "no tags", sub: "Add tags to enable filtering." });
  } else {
    issues.push({ type: "ok", msg: `${tagList.length} tag(s)`, sub: input.tags });
  }

  if (input.title.trim() && input.slug.trim() && tagList.length && (input.topic || tagList.length)) {
    issues.push({
      type: "ok",
      msg: "frontmatter valid",
      sub: "title · topic · tags · slug all present.",
    });
  }

  parsed.emptyHeadingLines.forEach((lineNum) => {
    const heading = headingByLine.get(lineNum);
    issues.push({
      type: "warn",
      msg: `h${heading?.level ?? 2} with no body content (line ${lineNum})`,
      sub: heading
        ? `The section "${heading.text}" has no paragraph before the next heading.`
        : "Add body content under this heading.",
      lineNum,
      fixLabel: `jump to L${lineNum}`,
      headingText: heading?.text,
    });
  });

  const links = internalLinks(parsed.lines);
  const broken = links.filter((l) => {
    const slug = slugFromInternalHref(l.href);
    return slug !== null && !input.knownSlugs.has(slug);
  });
  if (links.length === 0) {
    issues.push({ type: "ok", msg: "no internal links", sub: "Nothing to resolve." });
  } else if (broken.length === 0) {
    issues.push({
      type: "ok",
      msg: "all internal links resolve",
      sub: `${links.length} link${links.length === 1 ? "" : "s"} checked, 0 broken.`,
    });
  } else {
    broken.forEach((l) => {
      issues.push({
        type: "warn",
        msg: `broken link (line ${l.lineNum})`,
        sub: `${l.href} — no matching document slug.`,
        lineNum: l.lineNum,
        fixLabel: `jump to L${l.lineNum}`,
      });
    });
  }

  const untagged = untaggedFenceLines(parsed.lines);
  const fences = (input.body.match(/^```/gm) ?? []).length / 2;
  if (fences === 0) {
    issues.push({ type: "info", msg: "no code blocks", sub: "Fenced blocks optional." });
  } else if (untagged.length === 0) {
    issues.push({
      type: "ok",
      msg: "code blocks have language tags",
      sub: `${fences} fenced block${fences === 1 ? "" : "s"}, all tagged.`,
    });
  } else {
    untagged.forEach((lineNum) => {
      issues.push({
        type: "warn",
        msg: `code block missing language (line ${lineNum})`,
        sub: "Add a language id after the opening fence, e.g. ```rust",
        lineNum,
        fixLabel: `jump to L${lineNum}`,
      });
    });
  }

  issues.push({
    type: "info",
    msg: "reading time estimated",
    sub: `${words} words at 250 wpm → ~${readMin} min read.`,
  });

  if (input.topic) {
    issues.push({
      type: "info",
      msg: `topic accent: ${input.topic}`,
      sub: `Page will render with the ${input.topic} palette.`,
    });
  }

  return issues;
}

/** Curated checklist for the publish modal — warnings plus key passed checks. */
export function publishChecks(diags: EditorDiag[]): EditorDiag[] {
  const keyOk = new Set([
    "frontmatter valid",
    "slug available",
    "all internal links resolve",
    "code blocks have language tags",
  ]);
  return diags.filter((d) => d.type === "warn" || (d.type === "ok" && keyOk.has(d.msg)));
}
