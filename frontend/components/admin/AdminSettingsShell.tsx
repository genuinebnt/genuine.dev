"use client";

import AdminSettingsNav, {
  AdminSettingsMobileNav,
  type AdminSettingsSection,
} from "./AdminSettingsNav";

/** Full-height settings layout — sidebar rail + scrollable main (panel-fullbleed child). */
export default function AdminSettingsShell({
  active,
  children,
}: {
  active: AdminSettingsSection;
  children: React.ReactNode;
}) {
  return (
    <div className="ts-admin-shell">
      <AdminSettingsNav active={active} />
      <div className="ts-main">
        <AdminSettingsMobileNav active={active} />
        {children}
      </div>
    </div>
  );
}
