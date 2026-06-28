"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyReadingPrefs, pushRecentDoc } from "../lib/siteExtras";

/** Applies reading prefs and tracks recently visited docs/posts. */
export default function SiteEnhancements() {
  const path = usePathname();

  useEffect(() => {
    applyReadingPrefs();
    const onPrefs = () => applyReadingPrefs();
    window.addEventListener("reading-prefs-updated", onPrefs);
    return () => window.removeEventListener("reading-prefs-updated", onPrefs);
  }, []);

  useEffect(() => {
    if (path.startsWith("/blog/") && path !== "/blog") {
      const slug = path.split("/").pop() ?? "";
      const title = document.querySelector(".art-h1, h1")?.textContent?.trim() ?? slug;
      pushRecentDoc({ slug, title, href: path, kind: "post" });
    } else if (path.startsWith("/projects/") && path !== "/projects") {
      const slug = path.split("/").pop() ?? "";
      const title = document.querySelector("h1")?.textContent?.trim() ?? slug;
      pushRecentDoc({ slug, title, href: path, kind: "project" });
    }
  }, [path]);

  return null;
}
