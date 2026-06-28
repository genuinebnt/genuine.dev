"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { applyThemeForPath } from "../lib/theme";

/** Re-applies site + per-page theme when the client navigates between routes. */
export default function ThemeRoute() {
  const path = usePathname();

  useEffect(() => {
    applyThemeForPath(path);
  }, [path]);

  return null;
}
