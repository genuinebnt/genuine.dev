"use client";

import { useEffect, useState } from "react";
import AdminSettingsNav, {
  AdminSettingsMobileNav,
  type AdminSettingsSection,
} from "./AdminSettingsNav";

const COLLAPSE_KEY = "adminNavCollapsed";

/** Full-height settings layout — sidebar rail + scrollable main (panel-fullbleed child).
 * The rail collapses to icons-only; the preference persists in localStorage. */
export default function AdminSettingsShell({
  active,
  children,
}: {
  active: AdminSettingsSection;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className={`ts-admin-shell${collapsed ? " ts-collapsed" : ""}`}>
      <AdminSettingsNav active={active} collapsed={collapsed} onToggle={toggle} />
      <div className="ts-main">
        <AdminSettingsMobileNav active={active} />
        {children}
      </div>
    </div>
  );
}
