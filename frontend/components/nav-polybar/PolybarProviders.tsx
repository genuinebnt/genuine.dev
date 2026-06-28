"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatTimer } from "../../lib/polybar";

const WORK_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

type PomodoroPhase = "work" | "break";

type PomodoroState = {
  phase: PomodoroPhase;
  secondsLeft: number;
  running: boolean;
  toggleRun: () => void;
  reset: () => void;
};

type CountdownState = {
  minutes: 5 | 10 | 15;
  secondsLeft: number;
  running: boolean;
  display: string;
  toggleRun: () => void;
  reset: () => void;
  cyclePreset: () => void;
};

const PomodoroCtx = createContext<PomodoroState | null>(null);
const CountdownCtx = createContext<CountdownState | null>(null);

export function PolybarProviders({ children }: { children: ReactNode }) {
  return (
    <PomodoroProvider>
      <CountdownProvider>{children}</CountdownProvider>
    </PomodoroProvider>
  );
}

function PomodoroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK_SEC);
  const [running, setRunning] = useState(false);

  const rollPhase = useCallback(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const body = phase === "work" ? "Break time — step away." : "Focus block — back to work.";
      new Notification("Pomodoro", { body });
    }
    setPhase((p) => {
      const next = p === "work" ? "break" : "work";
      setSecondsLeft(next === "work" ? WORK_SEC : BREAK_SEC);
      setRunning(false);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          rollPhase();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, secondsLeft, rollPhase]);

  const value = useMemo<PomodoroState>(
    () => ({
      phase,
      secondsLeft,
      running,
      toggleRun: () => {
        if (!running && typeof Notification !== "undefined" && Notification.permission === "default") {
          void Notification.requestPermission();
        }
        setRunning((r) => !r);
      },
      reset: () => {
        setRunning(false);
        setPhase("work");
        setSecondsLeft(WORK_SEC);
      },
    }),
    [phase, secondsLeft, running],
  );

  return <PomodoroCtx.Provider value={value}>{children}</PomodoroCtx.Provider>;
}

const PRESETS = [5, 10, 15] as const;

function CountdownProvider({ children }: { children: ReactNode }) {
  const [minutes, setMinutes] = useState<(typeof PRESETS)[number]>(5);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, secondsLeft]);

  const value = useMemo<CountdownState>(() => {
    const display = secondsLeft > 0 || running ? formatTimer(secondsLeft) : `${minutes}m`;
    return {
      minutes,
      secondsLeft,
      running,
      display,
      toggleRun: () => {
        if (running) {
          setRunning(false);
          return;
        }
        if (secondsLeft <= 0) setSecondsLeft(minutes * 60);
        setRunning(true);
      },
      reset: () => {
        setRunning(false);
        setSecondsLeft(0);
      },
      cyclePreset: () => {
        if (running) return;
        setMinutes((m) => {
          const idx = PRESETS.indexOf(m);
          return PRESETS[(idx + 1) % PRESETS.length];
        });
        setSecondsLeft(0);
      },
    };
  }, [minutes, secondsLeft, running]);

  return <CountdownCtx.Provider value={value}>{children}</CountdownCtx.Provider>;
}

export function usePolybarPomodoro(): PomodoroState {
  const ctx = useContext(PomodoroCtx);
  if (!ctx) throw new Error("usePolybarPomodoro requires PolybarProviders");
  return ctx;
}

export function usePolybarCountdown(): CountdownState {
  const ctx = useContext(CountdownCtx);
  if (!ctx) throw new Error("usePolybarCountdown requires PolybarProviders");
  return ctx;
}
