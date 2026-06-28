"use client";

import { openSiteSearch } from "../../lib/polybar";

/** Opens the command palette — ⌘K shortcut still works; UI is icon-only. */
export default function PolybarSearch() {
  return (
    <div className="nav-tray-rail-cell nav-tray-search-cell">
      <button
        type="button"
        className="nav-tray-search"
        onClick={openSiteSearch}
        aria-label="Search site"
      >
        <span aria-hidden>⌕</span>
      </button>
    </div>
  );
}
