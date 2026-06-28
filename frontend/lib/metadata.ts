import type { PostItem } from "./api";

/** Typed access to document metadata JSON. */
export function docMetadata(doc: Pick<PostItem, "metadata">): Record<string, unknown> {
  return (doc.metadata ?? {}) as Record<string, unknown>;
}

export function projectTech(metadata?: Record<string, unknown>): string[] {
  return (metadata?.tech as string[] | undefined) ?? [];
}

export function projectGithub(metadata?: Record<string, unknown>): string | undefined {
  return metadata?.github as string | undefined;
}

export function projectBrowseUrl(metadata?: Record<string, unknown>): string | undefined {
  return metadata?.browse as string | undefined;
}

export function projectIsFeatured(metadata?: Record<string, unknown>): boolean {
  return metadata?.featured === true;
}

export function postTags(metadata?: Record<string, unknown>): string[] {
  return (metadata?.tags as string[] | undefined) ?? [];
}

export function postSeries(
  metadata?: Record<string, unknown>,
): { name: string; part: number } | undefined {
  const series = metadata?.series;
  if (!series || typeof series !== "object") return undefined;
  const { name, part } = series as { name?: unknown; part?: unknown };
  if (typeof name !== "string" || typeof part !== "number") return undefined;
  return { name, part };
}
