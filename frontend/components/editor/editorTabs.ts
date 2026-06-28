import type { EditDoc } from "../../lib/admin/types";

export const TABS_KEY = "editor-open-tabs";
export const TAB_NEW = "__new__";

export function readTabs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(TABS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeTabs(tabs: string[]) {
  sessionStorage.setItem(TABS_KEY, JSON.stringify(tabs));
}

export function tabSlug(initial: Pick<EditDoc, "slug">): string {
  return initial.slug || TAB_NEW;
}

export function tabLabel(slug: string, title: string, fallbackSlug: string): string {
  if (slug === TAB_NEW) return "untitled.md";
  return `${slug || fallbackSlug || "untitled"}.md`;
}

export function tabHref(slug: string): string {
  return slug === TAB_NEW ? "/admin/new" : `/admin/edit/${slug}`;
}

export function tabDisplayName(
  slug: string,
  currentTab: string,
  title: string,
): string {
  if (slug === currentTab) return tabLabel(slug, title, slug);
  if (slug === TAB_NEW) return "untitled.md";
  return `${slug}.md`;
}
