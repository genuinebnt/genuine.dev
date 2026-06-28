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

/** Left rail for admin settings — matches mockup content / site sections. */
export default function AdminSettingsNav({ active }: { active: AdminSettingsSection }) {
  return (
    <nav className="ts-admin-nav" aria-label="Admin">
      <div className="ts-admin-nav-scroll">
        <div className="ts-an-section">
          <span className="ts-an-label">content</span>
          <Link href="/admin" className="ts-an-item">
            <span aria-hidden>✎</span> Posts
          </Link>
          <Link href="/admin?kind=project" className="ts-an-item">
            <span aria-hidden>⊞</span> Projects
          </Link>
          <Link href="/admin?status=scheduled" className="ts-an-item">
            <span aria-hidden>◷</span> Scheduled
          </Link>
        </div>
        <div className="ts-an-section">
          <span className="ts-an-label">site</span>
          {SITE_LINKS.map((link) =>
            link.disabled || !link.href ? (
              <span key={link.id} className="ts-an-item ts-an-disabled" aria-disabled="true">
                <span aria-hidden>{link.icon}</span> {link.label}
              </span>
            ) : (
              <Link
                key={link.id}
                href={link.href}
                className={itemClass(active === link.id)}
                aria-current={active === link.id ? "page" : undefined}
              >
                <span aria-hidden>{link.icon}</span> {link.label}
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
