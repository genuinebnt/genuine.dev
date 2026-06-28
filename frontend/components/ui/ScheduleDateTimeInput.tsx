"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addMonths,
  calendarGrid,
  formatScheduleDisplay,
  MONTHS_SHORT,
  parseIsoDate,
  todayIso,
  toIsoDate,
  yearGridStart,
  yearGridYears,
} from "../../lib/calendar";
import { mergeScheduleValue, splitScheduleValue } from "../../lib/scheduleDateTime";

type InputClass = "mf-input" | "fg-input";

type Props = {
  value: string;
  onChange: (value: string) => void;
  inputClass?: InputClass;
  id?: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const PANEL_WIDTH = 248;
const VIEWPORT_MARGIN = 10;

function computePanelPos(trigger: DOMRect, panelHeight: number) {
  let left = trigger.left + (trigger.width - PANEL_WIDTH) / 2;
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN),
  );

  let top = trigger.bottom + 6;
  if (top + panelHeight > window.innerHeight - VIEWPORT_MARGIN) {
    top = Math.max(VIEWPORT_MARGIN, trigger.top - panelHeight - 6);
  }

  return { top, left, width: PANEL_WIDTH };
}

function viewFromValue(value: string): { year: number; month: number } {
  const { date } = splitScheduleValue(value);
  const parsed = parseIsoDate(date);
  if (parsed) return { year: parsed.year, month: parsed.month };
  const t = todayIso();
  return { year: t.year, month: t.month };
}

function eventInsideNode(node: Node | null, event: Event): boolean {
  if (!node) return false;
  const path = typeof event.composedPath === "function" ? event.composedPath() : null;
  if (path) return path.includes(node);
  const target = event.target;
  return target instanceof Node && node.contains(target);
}

type PanelMode = "days" | "months" | "years";

/** Custom schedule picker — site-styled panel instead of native calendar popup. */
export default function ScheduleDateTimeInput({
  value,
  onChange,
  inputClass = "mf-input",
  id,
}: Props) {
  const fallbackId = useId();
  const triggerId = id ?? fallbackId;
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("days");
  const [yearPageStart, setYearPageStart] = useState(() => yearGridStart(todayIso().year));
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: PANEL_WIDTH });
  const [view, setView] = useState(() => viewFromValue(value));

  const { date, time } = splitScheduleValue(value);
  const selected = parseIsoDate(date);
  const today = todayIso();
  const display = formatScheduleDisplay(value);

  const reposition = useCallback(() => {
    const trigger = wrapRef.current?.getBoundingClientRect();
    if (!trigger) return;
    const height = panelRef.current?.offsetHeight ?? 280;
    setPanelPos(computePanelPos(trigger, height));
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    const id = requestAnimationFrame(reposition);
    const onScroll = () => reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, reposition, view, panelMode, yearPageStart]);

  function closePanel() {
    setOpen(false);
    setPanelMode("days");
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    const onPointer = (e: MouseEvent) => {
      if (eventInsideNode(wrapRef.current, e) || eventInsideNode(panelRef.current, e)) return;
      closePanel();
    };
    window.addEventListener("keydown", onKey);
    // Defer so the opening click on the trigger does not immediately dismiss.
    const id = window.setTimeout(() => window.addEventListener("click", onPointer), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
      window.removeEventListener("click", onPointer);
    };
  }, [open]);

  function pickDay(day: number) {
    const iso = toIsoDate(view.year, view.month, day);
    onChange(mergeScheduleValue(iso, time || "09:00"));
  }

  function setTimePart(nextTime: string) {
    if (!date) return;
    onChange(mergeScheduleValue(date, nextTime));
  }

  function clearValue() {
    onChange("");
    closePanel();
  }

  function openYearGrid() {
    setYearPageStart(yearGridStart(view.year));
    setPanelMode("years");
  }

  function headNav(delta: number) {
    if (panelMode === "years") {
      setYearPageStart((s) => s + delta * 12);
      return;
    }
    setView((v) => addMonths(v.year, v.month, delta));
  }

  const panel = open ? (
    <div
      ref={panelRef}
      className="dt-picker-panel"
      role="dialog"
      aria-label="Pick date and time"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
      }}
    >
      <div className="dt-picker-head">
        <button
          type="button"
          className="dt-picker-nav"
          aria-label={panelMode === "years" ? "Previous years" : "Previous month"}
          onClick={() => headNav(-1)}
        >
          ‹
        </button>
        <div className="dt-picker-head-center">
          {panelMode === "years" ? (
            <span className="dt-picker-head-title">
              {yearPageStart}–{yearPageStart + 11}
            </span>
          ) : (
            <>
              <button
                type="button"
                className={`dt-picker-head-chip${panelMode === "months" ? " is-active" : ""}`}
                onClick={() => setPanelMode((m) => (m === "months" ? "days" : "months"))}
              >
                {MONTHS_SHORT[view.month - 1]}
              </button>
              <button
                type="button"
                className="dt-picker-head-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  openYearGrid();
                }}
              >
                {view.year}
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          className="dt-picker-nav"
          aria-label={panelMode === "years" ? "Next years" : "Next month"}
          onClick={() => headNav(1)}
        >
          ›
        </button>
      </div>

      {panelMode === "months" && (
        <div className="dt-picker-meta-grid">
          {MONTHS_SHORT.map((label, i) => {
            const month = i + 1;
            const isCurrent = view.month === month;
            return (
              <button
                key={label}
                type="button"
                className={`dt-picker-meta-cell${isCurrent ? " is-selected" : ""}`}
                onClick={() => {
                  setView((v) => ({ ...v, month }));
                  setPanelMode("days");
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {panelMode === "years" && (
        <div className="dt-picker-meta-grid">
          {yearGridYears(yearPageStart).map((year) => {
            const isCurrent = view.year === year;
            const isThisYear = today.year === year;
            return (
              <button
                key={year}
                type="button"
                className={`dt-picker-meta-cell${isCurrent ? " is-selected" : ""}${isThisYear ? " is-today" : ""}`}
                onClick={() => {
                  setView((v) => ({ ...v, year }));
                  setPanelMode("days");
                }}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      {panelMode === "days" && (
        <>
          <div className="dt-picker-weekdays" aria-hidden>
            {WEEKDAYS.map((d) => (
              <span key={d} className="dt-picker-weekday">
                {d}
              </span>
            ))}
          </div>

          <div className="dt-picker-grid">
            {calendarGrid(view.year, view.month).map((day, i) => {
              if (day === null) {
                return <span key={`pad-${i}`} className="dt-picker-pad" aria-hidden />;
              }
              const isSelected =
                selected?.year === view.year &&
                selected?.month === view.month &&
                selected?.day === day;
              const isToday =
                today.year === view.year && today.month === view.month && today.day === day;
              return (
                <button
                  key={`${view.year}-${view.month}-${day}`}
                  type="button"
                  className={`dt-picker-day${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                  onClick={() => pickDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="dt-picker-time">
        <span className="dt-picker-time-label">time</span>
        <select
          className="dt-picker-time-select"
          value={time.slice(0, 2) || "09"}
          disabled={!date}
          aria-label="Hour"
          onChange={(e) => setTimePart(`${e.target.value}:${(time.slice(3, 5) || "00")}`)}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="dt-picker-time-sep">:</span>
        <select
          className="dt-picker-time-select"
          value={time.slice(3, 5) || "00"}
          disabled={!date}
          aria-label="Minute"
          onChange={(e) => setTimePart(`${(time.slice(0, 2) || "09")}:${e.target.value}`)}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="dt-picker-foot">
        <button type="button" className="dt-picker-foot-btn" onClick={clearValue}>
          Clear
        </button>
        <button type="button" className="dt-picker-foot-btn dt-picker-done" onClick={closePanel}>
          Done
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="dt-picker-wrap" ref={wrapRef}>
      <button
        id={triggerId}
        type="button"
        className={`dt-picker-trigger ${inputClass}${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          const next = viewFromValue(value);
          setView(next);
          setYearPageStart(yearGridStart(next.year));
          setPanelMode("days");
          setOpen((v) => !v);
        }}
      >
        {display || <span className="dt-picker-placeholder">Pick date &amp; time</span>}
      </button>
      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
