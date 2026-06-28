export const TOPIC_COLORS: Record<string, string> = {
  rust: "#f0703c",
  infosec: "var(--acc)",
  distributed: "var(--blue)",
  systems: "var(--purple)",
  performance: "#d957d4",
  ctf: "#ef5350",
};

/** Canonical topic keys — use everywhere instead of duplicating arrays. */
export const TOPIC_KEYS = Object.keys(TOPIC_COLORS) as (keyof typeof TOPIC_COLORS)[];

export const TOPIC_CSS_CLASSES: Record<string, string> = {
  rust: "t-rust",
  infosec: "t-infosec",
  distributed: "t-distributed",
  systems: "t-systems",
  performance: "t-performance",
  ctf: "t-ctf",
};

/** Derive a topic from metadata, falling back to the first tag. */
export function deriveTopic(metadata?: Record<string, unknown>): string {
  if (!metadata) return "";
  const topic = metadata.topic as string | undefined;
  if (topic) return topic.toLowerCase();
  const tags = metadata.tags as string[] | undefined;
  return (tags?.[0] ?? "").toLowerCase();
}

export function topicColor(topic?: string): string {
  return TOPIC_COLORS[topic?.toLowerCase() ?? ""] ?? "var(--acc)";
}

export function topicCssClass(topic?: string): string {
  return TOPIC_CSS_CLASSES[topic?.toLowerCase() ?? ""] ?? "";
}
