import { isPortfolioPage, projectCaseStudyHref } from "./projects";
import type { AdminItem } from "./auth";

/** Slugs backed by static React case-study pages — not the CMS editor. */
export function isStaticCaseStudy(slug: string): boolean {
  return isPortfolioPage(slug);
}

/** Public path for admin preview / “view live” links. */
export function publicDocPath(item: Pick<AdminItem, "slug" | "kind">): string | null {
  if (item.kind === "post") return `/blog/${item.slug}`;
  if (item.kind === "page") return item.slug === "home" ? "/" : `/${item.slug}`;
  if (item.kind === "project") return projectCaseStudyHref(item.slug);
  return null;
}

/** Whether this row opens in the markdown admin editor. */
export function isAdminEditable(item: Pick<AdminItem, "slug" | "kind">): boolean {
  return item.kind !== "project" || !isStaticCaseStudy(item.slug);
}

/** Portfolio projects rendered from `app/projects/<slug>` — listed in admin but not CMS-edited. */
export function isStaticCaseStudyRow(item: Pick<AdminItem, "slug" | "kind">): boolean {
  return item.kind === "project" && isStaticCaseStudy(item.slug);
}
