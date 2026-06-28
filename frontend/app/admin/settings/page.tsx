"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSettingsShell from "../../../components/admin/AdminSettingsShell";
import {
  readClockTz,
  readStatusLine,
  writeClockTz,
  writeReadingPrefs,
  readReadingPrefs,
  writeStatusLine,
} from "../../../lib/siteExtras";

const SECTIONS = [
  {
    href: "/admin/settings/theme",
    icon: "◑",
    title: "Theme",
    description: "Presets, accent color, per-page overrides, and live preview.",
  },
  {
    href: "/admin/settings/polybar",
    icon: "◆",
    title: "Polybar",
    description: "Nav widgets — clock, timers, appearance toggle, search, and tray order.",
  },
] as const;

const TZ_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function AdminSettingsPage() {
  const [statusLine, setStatusLine] = useState("");
  const [clockTz, setClockTz] = useState("UTC");
  const [proseWidth, setProseWidth] = useState<"default" | "narrow" | "wide">("default");

  useEffect(() => {
    setStatusLine(readStatusLine());
    setClockTz(readClockTz());
    setProseWidth(readReadingPrefs().proseWidth);
  }, []);

  function saveSiteExtras() {
    writeStatusLine(statusLine);
    writeClockTz(clockTz);
    writeReadingPrefs({ proseWidth });
  }

  return (
    <AdminSettingsShell active="settings">
      <div className="ts-page-title">Settings</div>
      <div className="ts-page-sub">
        Site configuration for public pages. Theme and polybar changes preview in your browser until
        you save.
      </div>

      <div className="ts-sec-h">site extras</div>
      <div className="settings-inline-form">
        <div className="settings-field">
          <label htmlFor="status-line">Polybar status line</label>
          <input
            id="status-line"
            className="mf-input"
            value={statusLine}
            onChange={(e) => setStatusLine(e.target.value)}
            placeholder="Building in public…"
            maxLength={80}
          />
        </div>
        <div className="settings-field">
          <label htmlFor="clock-tz">Clock timezone</label>
          <select id="clock-tz" className="mf-input" value={clockTz} onChange={(e) => setClockTz(e.target.value)}>
            {TZ_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <div className="settings-field">
          <label>Default reading width</label>
          <div className="reading-prefs-row">
            {(["default", "narrow", "wide"] as const).map((w) => (
              <button
                key={w}
                type="button"
                className={`ts-btn${proseWidth === w ? " ts-edit" : ""}`}
                onClick={() => setProseWidth(w)}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="ts-btn-lg ts-primary" onClick={saveSiteExtras}>
          Save site extras
        </button>
      </div>

      <div className="ts-sec-h">sections</div>
      <div className="ts-settings-grid">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="ts-settings-card">
            <span className="ts-settings-card-icon" aria-hidden>
              {section.icon}
            </span>
            <span className="ts-settings-card-title">{section.title}</span>
            <span className="ts-settings-card-desc">{section.description}</span>
          </Link>
        ))}
        <div className="ts-settings-card ts-settings-card-disabled">
          <span className="ts-settings-card-icon" aria-hidden>
            ↗
          </span>
          <span className="ts-settings-card-title">Analytics</span>
          <span className="ts-settings-card-desc">Visitor stats and newsletter metrics — coming soon.</span>
        </div>
      </div>
    </AdminSettingsShell>
  );
}
