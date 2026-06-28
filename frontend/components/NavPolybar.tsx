"use client";

import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { collapsedWidgetIds, trayWidgetIds } from "../lib/polybar";
import { usePolybarConfig } from "../lib/usePolybarConfig";
import { PolybarProviders } from "./nav-polybar/PolybarProviders";
import { renderPolybarWidget, renderPolybarWidgetCompact } from "./nav-polybar/renderWidget";

/** Match `.nav-tray` close transition in globals.scss */
const TRAY_CLOSE_MS = 360;

/**
 * Polybar utility tray — admin-configurable widgets in a single nav pill.
 */
export default function NavPolybar() {
  const pathname = usePathname();
  const settings = usePolybarConfig();
  const wrapRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [railVisible, setRailVisible] = useState(true);

  const widgets = trayWidgetIds(settings);
  const railCells = collapsedWidgetIds(settings);

  const barCells = useMemo(() => {
    if (open) return railCells.filter((id) => id === "search");
    if (railVisible) return railCells;
    return railCells.filter((id) => id === "search");
  }, [open, railCells, railVisible]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      setRailVisible(false);
      return;
    }
    if (!wasOpenRef.current) {
      setRailVisible(true);
      return;
    }
    const id = window.setTimeout(() => setRailVisible(true), TRAY_CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <PolybarProviders>
      <div className="nav-tray-wrap" ref={wrapRef}>
        <div className={`nav-tray${open ? " is-open" : ""}`} aria-hidden={!open}>
          <div className="nav-tray-inner">
            {widgets.length === 0 ? (
              <span className="nav-tray-empty">No widgets enabled — configure in admin</span>
            ) : (
              widgets.map((id, i) => (
                <Fragment key={id}>
                  {i > 0 && <span className="nav-tray-sep" aria-hidden />}
                  {renderPolybarWidget(id, pathname)}
                </Fragment>
              ))
            )}
          </div>
        </div>
        <div className="nav-tray-bar">
          {barCells.map((id, i) => (
            <Fragment key={id}>
              {i > 0 && <span className="nav-tray-sep" aria-hidden />}
              {renderPolybarWidgetCompact(id)}
            </Fragment>
          ))}
          {barCells.length > 0 && <span className="nav-tray-sep" aria-hidden />}
          <button
            type="button"
            className="nav-tray-toggle"
            aria-expanded={open}
            aria-label={open ? "Close utility tray" : "Open utility tray"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="nav-tray-chevron" aria-hidden>
              {open ? "›" : "‹"}
            </span>
          </button>
        </div>
      </div>
    </PolybarProviders>
  );
}
