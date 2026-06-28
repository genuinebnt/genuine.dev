/** Client-side list paging — used by admin, writing index, and projects. */

export const ADMIN_PAGE_SIZE = 20;
export const WRITING_PAGE_SIZE = 10;
export const PROJECTS_PAGE_SIZE = 2;

export function parsePageParam(value: string | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function pageCount(total: number, pageSize: number): number {
  if (total === 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(page: number, total: number, pageSize: number): number {
  return Math.min(Math.max(1, page), pageCount(total, pageSize));
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number): T[] {
  if (items.length <= pageSize) return items;
  const safePage = clampPage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function pageRange(page: number, total: number, pageSize: number): { start: number; end: number } {
  if (total === 0) return { start: 0, end: 0 };
  const safePage = clampPage(page, total, pageSize);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  return { start, end };
}

/** Keep `?page=` in sync without a navigation reload. */
export function writePageQuery(page: number): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));
  const qs = params.toString();
  const path = window.location.pathname;
  window.history.replaceState(null, "", qs ? `${path}?${qs}` : path);
}
