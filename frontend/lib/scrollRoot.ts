/** Returns true when an element is the active vertical scroll container. */
export function isScrollable(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el);
  return /(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight + 1;
}

function collectScrollableElements(root: HTMLElement): HTMLElement[] {
  const found: HTMLElement[] = [];
  if (isScrollable(root)) found.push(root);
  for (const child of Array.from(root.children) as HTMLElement[]) {
    found.push(...collectScrollableElements(child));
  }
  return found;
}

/** Locate the primary scroll container for a reading panel (prefers `[data-scroll-root]`). */
export function findScrollRoot(el: HTMLElement): HTMLElement | Window {
  if (el.hasAttribute("data-scroll-root") && isScrollable(el)) {
    return el;
  }

  const marked = el.querySelector("[data-scroll-root]");
  if (marked instanceof HTMLElement && isScrollable(marked)) {
    return marked;
  }

  const scrollables = collectScrollableElements(el);
  if (scrollables.length > 0) {
    return scrollables.reduce((best, node) =>
      node.scrollHeight - node.clientHeight > best.scrollHeight - best.clientHeight ? node : best,
    );
  }

  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.documentElement) {
    if (isScrollable(node)) return node;
    node = node.parentElement;
  }
  return window;
}

/** Scroll a hash target into view inside a panel scroll column (not the window). */
export function scrollToHashTarget(
  scrollRoot: HTMLElement | Window,
  target: HTMLElement,
  offset = 12,
): void {
  if (scrollRoot === window) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const container = scrollRoot as HTMLElement;
  const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  container.scrollTo({ top: Math.max(0, top - offset), behavior: "smooth" });
}
