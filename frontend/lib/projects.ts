/** Portfolio slugs with rich static case-study pages. */
export const PORTFOLIO_SLUGS = ["notiq", "genuine-dev", "db-labs"] as const;

export type PortfolioSlug = (typeof PORTFOLIO_SLUGS)[number];

export type ProjectStatus = "complete" | "wip";

const PORTFOLIO_ROUTES: Record<PortfolioSlug, string> = {
  notiq: "/projects/notiq",
  "genuine-dev": "/projects/genuine-dev",
  "db-labs": "/projects/db-labs",
};

const PROJECT_ACCENTS: Record<PortfolioSlug, string> = {
  notiq: "var(--acc)",
  "genuine-dev": "var(--blue)",
  "db-labs": "var(--purple)",
};

const LEGACY_REDIRECTS: Record<string, string> = {
  "genuine-folio": "/projects/genuine-dev",
};

/** Case-study href — portfolio slugs map to static pages. */
export function projectCaseStudyHref(slug: string): string {
  if (slug in PORTFOLIO_ROUTES) {
    return PORTFOLIO_ROUTES[slug as PortfolioSlug];
  }
  return `/projects/${slug}`;
}

/** Redirect target for legacy or portfolio slugs; null when slug should use CMS fallback. */
export function portfolioRedirectPath(slug: string): string | null {
  if (slug in LEGACY_REDIRECTS) return LEGACY_REDIRECTS[slug];
  if (slug in PORTFOLIO_ROUTES) return PORTFOLIO_ROUTES[slug as PortfolioSlug];
  return null;
}

export function isPortfolioPage(slug: string): slug is PortfolioSlug {
  return PORTFOLIO_SLUGS.includes(slug as PortfolioSlug);
}

/** Accent bar color for known portfolio slugs. */
export function projectAccentColor(slug: string): string | null {
  if (isPortfolioPage(slug)) return PROJECT_ACCENTS[slug];
  return null;
}

/** Explicit metadata.status only — learning projects omit status badges. */
export function projectStatusFromMetadata(
  metadata?: Record<string, unknown>,
): ProjectStatus | null {
  const raw = metadata?.status as string | undefined;
  if (!raw) return null;
  return raw.toLowerCase() === "complete" ? "complete" : "wip";
}

export function projectStatusLabel(status: ProjectStatus): string {
  return status === "complete" ? "complete" : "in progress";
}

/** Default rainbow divider colors shared by portfolio case studies. */
export const PORTFOLIO_RAINBOW = [
  "var(--warn)",
  "var(--purple)",
  "var(--blue)",
  "var(--acc)",
  "var(--faint)",
] as const;
