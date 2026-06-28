"use client";

import Link from "next/link";
import AdminLogout from "../AdminLogout";

export type AdminSettingsSection = "theme" | "settings" | "polybar";

const SITE_LINKS: {
  id: AdminSettingsSection | "analytics";
  href?: string;
  icon: string;
  label: string;
  disabled?: boolean;
}[] = [
  { id: "theme", href: "/admin/settings/theme", icon: "◑", label: "Theme" },
  { id: "settings", href: "/admin/settings", icon: "⚙", label: "Settings" },
  { id: "polybar", href: "/admin/settings/polybar", icon: "◆", label: "Polybar" },
  { id: "analytics", icon: "↗", label: "Analytics", disabled: true },
];

function itemClass(active: boolean, extra?: string) {
  return ["ts-an-item", active ? "ts-active" : "", extra].filter(Boolean).join(" ");
}

export function AdminSettingsMobileNav({ active }: { active: AdminSettingsSection }) {
  return (
    <nav className="ts-admin-mobile-nav" aria-label="Settings sections">
      {SITE_LINKS.filter((link) => !link.disabled && link.href).map((link) => (
        <Link
          key={link.id}
          href={link.href!}
          className={itemClass(active === link.id, "ts-admin-mobile-chip")}
        >
          <span aria-hidden>{link.icon}</span> {link.label}
        </Link>
      ))}
    </nav>
  );
}

const CONTENT_LINKS = [
  { href: "/admin", icon: "✎", label: "Posts" },
  { href: "/admin?kind=project", icon: "⊞", label: "Projects" },
  { href: "/admin?status=scheduled", icon: "◷", label: "Scheduled" },
];

/** Left rail for admin settings — matches mockup content / site sections.
 * Collapses to icons-only (persisted toggle) to give the main area more room. */
export default function AdminSettingsNav({
  active,
  collapsed = false,
  onToggle,
}: {
  active: AdminSettingsSection;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <nav className="ts-admin-nav" aria-label="Admin">
      <button
        type="button"
        className="ts-an-toggle"
        onClick={onToggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
      >
        <span aria-hidden>{collapsed ? "»" : "«"}</span>
      </button>
      <div className="ts-admin-nav-scroll">
        <div className="ts-an-section">
          <span className="ts-an-label">content</span>
          {CONTENT_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="ts-an-item" title={link.label}>
              <span className="ts-an-ic" aria-hidden>{link.icon}</span>
              <span className="ts-an-text">{link.label}</span>
            </Link>
          ))}
        </div>
        <div className="ts-an-section">
          <span className="ts-an-label">site</span>
          {SITE_LINKS.map((link) =>
            link.disabled || !link.href ? (
              <span
                key={link.id}
                className="ts-an-item ts-an-disabled"
                aria-disabled="true"
                title={link.label}
              >
                <span className="ts-an-ic" aria-hidden>{link.icon}</span>
                <span className="ts-an-text">{link.label}</span>
              </span>
            ) : (
              <Link
                key={link.id}
                href={link.href}
                className={itemClass(active === link.id)}
                aria-current={active === link.id ? "page" : undefined}
                title={link.label}
              >
                <span className="ts-an-ic" aria-hidden>{link.icon}</span>
                <span className="ts-an-text">{link.label}</span>
              </Link>
            ),
          )}
        </div>
      </div>
      <div className="ts-an-section ts-an-session">
        <span className="ts-an-label">session</span>
        <AdminLogout className="ts-an-item ts-an-logout" label="Log out" />
      </div>
    </nav>
  );
}
