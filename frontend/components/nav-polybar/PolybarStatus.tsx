"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readStatusLine } from "../../lib/siteExtras";

export function PolybarStatusCompact() {
  const [line, setLine] = useState("");

  useEffect(() => {
    const sync = () => setLine(readStatusLine());
    sync();
    window.addEventListener("status-line-updated", sync);
    return () => window.removeEventListener("status-line-updated", sync);
  }, []);

  if (!line) return null;
  return (
    <span className="nav-tray-status-compact" title={line}>
      {line.length > 24 ? `${line.slice(0, 22)}…` : line}
    </span>
  );
}

export default function PolybarStatus() {
  const [line, setLine] = useState("");

  useEffect(() => {
    const sync = () => setLine(readStatusLine());
    sync();
    window.addEventListener("status-line-updated", sync);
    return () => window.removeEventListener("status-line-updated", sync);
  }, []);

  if (!line) {
    return (
      <div className="nav-tray-widget nav-tray-status nav-tray-status-empty">
        <span className="nav-status-hint">
          Set a line in{" "}
          <Link href="/admin/settings" className="nav-status-link">
            Settings
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className="nav-tray-widget nav-tray-status" title={line}>
      <span className="nav-status-text">{line}</span>
    </div>
  );
}
