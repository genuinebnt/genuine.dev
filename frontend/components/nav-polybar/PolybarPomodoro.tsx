"use client";

import { formatTimer } from "../../lib/polybar";
import { usePolybarPomodoro } from "./PolybarProviders";

export function PolybarPomodoroCompact() {
  const { phase, secondsLeft, running, toggleRun } = usePolybarPomodoro();

  return (
    <div className={`nav-tray-rail-cell nav-tray-pomodoro phase-${phase}`}>
      <span className="nav-timer-display nav-tray-rail-timer">{formatTimer(secondsLeft)}</span>
      <button
        type="button"
        className="ft-btn nav-tray-ic-btn"
        onClick={toggleRun}
        title={running ? "Pause pomodoro" : "Start pomodoro"}
        aria-label={running ? "Pause pomodoro" : "Start pomodoro"}
      >
        {running ? "❚❚" : "▶"}
      </button>
    </div>
  );
}

export default function PolybarPomodoro() {
  const { phase, secondsLeft, running, toggleRun, reset } = usePolybarPomodoro();

  return (
    <div className={`nav-tray-widget nav-tray-pomodoro phase-${phase}`}>
      <span className="nav-timer-display" title={phase === "work" ? "Focus" : "Break"}>
        {formatTimer(secondsLeft)}
      </span>
      <button
        type="button"
        className="ft-btn nav-tray-ic-btn"
        onClick={toggleRun}
        title={running ? "Pause" : "Start"}
        aria-label={running ? "Pause pomodoro" : "Start pomodoro"}
      >
        {running ? "❚❚" : "▶"}
      </button>
      <button type="button" className="ft-btn nav-tray-ic-btn" onClick={reset} title="Reset" aria-label="Reset pomodoro">
        ↺
      </button>
    </div>
  );
}
