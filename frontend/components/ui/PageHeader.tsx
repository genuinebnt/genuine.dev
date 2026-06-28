import type { ReactNode } from "react";

/**
 * Shared page header (eyebrow + title, optional right-aligned action).
 * Keeps admin/editor/auth pages visually consistent with the public site.
 */
export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="ph-title">{title}</h1>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}
