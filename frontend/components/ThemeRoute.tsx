"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyThemeForPath } from "../lib/theme";

/** Re-applies site + per-page theme when the client navigates between routes. */
export default function ThemeRoute() {
  const path = usePathname();

  useEffect(() => {
    applyThemeForPath(path);
  }, [path]);

  useEffect(() => {
    const onThemeUpdated = () => applyThemeForPath(path);
    window.addEventListener("theme-updated", onThemeUpdated);
    return () => window.removeEventListener("theme-updated", onThemeUpdated);
  }, [path]);

  return null;
}
