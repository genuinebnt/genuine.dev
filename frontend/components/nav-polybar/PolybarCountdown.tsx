"use client";

import { usePolybarCountdown } from "./PolybarProviders";

export function PolybarCountdownCompact() {
  const { minutes, running, display, toggleRun, cyclePreset } = usePolybarCountdown();

  return (
    <div className="nav-tray-rail-cell nav-tray-countdown">
      <button
        type="button"
        className="meta-pill nav-tray-pill nav-tray-rail-pill"
        onClick={cyclePreset}
        disabled={running}
        title="Cycle preset duration"
      >
        {minutes}m
      </button>
      <span className="nav-timer-display nav-tray-rail-timer">{display}</span>
      <button
        type="button"
        className="ft-btn nav-tray-ic-btn"
        onClick={toggleRun}
        title={running ? "Pause countdown" : "Start countdown"}
        aria-label={running ? "Pause countdown" : "Start countdown"}
      >
        {running ? "❚❚" : "▶"}
      </button>
    </div>
  );
}

export default function PolybarCountdown() {
  const { minutes, running, display, toggleRun, reset, cyclePreset } = usePolybarCountdown();

  return (
    <div className="nav-tray-widget nav-tray-countdown">
      <button
        type="button"
        className="meta-pill nav-tray-pill"
        onClick={cyclePreset}
        disabled={running}
        title="Cycle preset duration"
      >
        {minutes}m
      </button>
      <span className="nav-timer-display">{display}</span>
      <button
        type="button"
        className="ft-btn nav-tray-ic-btn"
        onClick={toggleRun}
        title={running ? "Pause" : "Start"}
        aria-label={running ? "Pause countdown" : "Start countdown"}
      >
        {running ? "❚❚" : "▶"}
      </button>
      <button type="button" className="ft-btn nav-tray-ic-btn" onClick={reset} title="Reset" aria-label="Reset countdown">
        ↺
      </button>
    </div>
  );
}
