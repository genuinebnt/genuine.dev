import type { ReactNode } from "react";
import type { PolybarWidgetId } from "../../lib/polybar";
import PolybarAppearance, { PolybarAppearanceCompact } from "./PolybarAppearance";
import PolybarClock, { PolybarClockCompact } from "./PolybarClock";
import PolybarCountdown, { PolybarCountdownCompact } from "./PolybarCountdown";
import PolybarPomodoro, { PolybarPomodoroCompact } from "./PolybarPomodoro";
import PolybarSearch from "./PolybarSearch";
import PolybarNotifications from "./PolybarNotifications";
import PolybarStatus, { PolybarStatusCompact } from "./PolybarStatus";
import PolybarThemePreview from "./PolybarThemePreview";
import { PolybarThemeCompact } from "./PolybarThemeCompact";

export function renderPolybarWidget(id: PolybarWidgetId, pathname: string): ReactNode {
  switch (id) {
    case "clock":
      return <PolybarClock />;
    case "status":
      return <PolybarStatus />;
    case "appearance":
      return <PolybarAppearance />;
    case "theme":
      return <PolybarThemePreview pathname={pathname} />;
    case "pomodoro":
      return <PolybarPomodoro />;
    case "countdown":
      return <PolybarCountdown />;
    default:
      return null;
  }
}

export function renderPolybarWidgetCompact(id: PolybarWidgetId): ReactNode {
  switch (id) {
    case "clock":
      return (
        <div className="nav-tray-rail-cell nav-tray-rail-clock">
          <PolybarClockCompact />
        </div>
      );
    case "status":
      return (
        <div className="nav-tray-rail-cell nav-tray-status">
          <PolybarStatusCompact />
        </div>
      );
    case "appearance":
      return <PolybarAppearanceCompact />;
    case "theme":
      return <PolybarThemeCompact />;
    case "pomodoro":
      return <PolybarPomodoroCompact />;
    case "countdown":
      return <PolybarCountdownCompact />;
    case "notifications":
      return <PolybarNotifications />;
    case "search":
      return <PolybarSearch />;
    default:
      return null;
  }
}
