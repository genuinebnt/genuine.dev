"use client";

import { useEffect, useState } from "react";
import { readClockTz } from "../../lib/siteExtras";

/** Fixed locale so Node SSR and browser agree when the clock is live. */
const CLOCK_LOCALE = "en-GB";

function useLiveClock(tickMs = 1000) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [tz, setTz] = useState("UTC");

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    setTz(readClockTz());
    const id = window.setInterval(() => setNow(new Date()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  useEffect(() => {
    if (!mounted) return;
    const sync = () => setTz(readClockTz());
    window.addEventListener("clock-tz-updated", sync);
    return () => window.removeEventListener("clock-tz-updated", sync);
  }, [mounted]);

  return { mounted, now, tz };
}

const timeFmt: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

const timeCompactFmt: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const dateFmt: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

function formatTime(now: Date, tz: string, compact = false) {
  return now.toLocaleTimeString(CLOCK_LOCALE, {
    ...(compact ? timeCompactFmt : timeFmt),
    timeZone: tz,
  });
}

function formatDate(now: Date, tz: string) {
  return now.toLocaleDateString(CLOCK_LOCALE, { ...dateFmt, timeZone: tz });
}

/** Collapsed toggle hint — time only. */
export function PolybarClockCompact() {
  const { mounted, now, tz } = useLiveClock(30_000);

  if (!mounted || !now) {
    return (
      <time className="nav-tray-clock-compact" dateTime="" suppressHydrationWarning aria-hidden>
        --:--
      </time>
    );
  }

  return (
    <time className="nav-tray-clock-compact" dateTime={now.toISOString()} title={tz}>
      {formatTime(now, tz, true)}
    </time>
  );
}

/** Expanded tray cell — time row + date/tz meta row. */
export default function PolybarClock() {
  const { mounted, now, tz } = useLiveClock();

  if (!mounted || !now) {
    return (
      <div className="nav-tray-widget nav-tray-clock" aria-hidden>
        <time className="nav-clock-time" dateTime="" suppressHydrationWarning>
          --:--:--
        </time>
        <span className="nav-clock-meta">— · …</span>
      </div>
    );
  }

  const tzShort = tz.split("/").pop() ?? tz;

  return (
    <div className="nav-tray-widget nav-tray-clock">
      <time className="nav-clock-time" dateTime={now.toISOString()}>
        {formatTime(now, tz)}
      </time>
      <span className="nav-clock-meta" title={tz}>
        {formatDate(now, tz)} · {tzShort}
      </span>
    </div>
  );
}
