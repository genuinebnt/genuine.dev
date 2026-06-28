"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/**
 * Chooses page chrome by route.
 *
 * Panel pages (`panel-fullbleed`) fill the viewport below the nav edge-to-edge,
 * matching the mockup `.win` shells (fixed sidebar rails + full-width content).
 * The admin editor stays true edge-to-edge (`editor-fullbleed`).
 *
 * Auth pages centre their card with a full-height flex container, also no footer.
 *
 * Home, portfolio case studies, and 404 use padded shell + footer.
 * Admin content list (`/admin`) uses padded shell without footer; settings keep panel shell.
 */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  const isEditor = path.startsWith("/admin/new") || path.startsWith("/admin/edit");

  const isAdminList = path === "/admin";

  const isAdminSettings = path.startsWith("/admin/settings");

  // Two-column pages: sidebar rail fills viewport height below the nav (no footer).
  // Portfolio sub-routes (/projects/notiq, /projects/genuine-dev) keep the normal shell.
  const isPanelPage =
    path === "/blog" ||
    path.startsWith("/blog/") ||
    path === "/projects" ||
    path === "/about" ||
    path === "/now" ||
    path === "/uses";

  const isAuth = path === "/admin/login";

  if (isEditor) {
    return <main className="editor-fullbleed">{children}</main>;
  }

  if (isPanelPage || isAdminSettings) {
    return (
      <main className="panel-fullbleed">
        <div className="panel-stage">{children}</div>
      </main>
    );
  }

  if (isAdminList) {
    return <main className="shell page">{children}</main>;
  }

  if (isAuth) {
    return <main className="auth-fullbleed">{children}</main>;
  }

  return (
    <>
      <main className="shell page">{children}</main>
      <Footer />
    </>
  );
}
