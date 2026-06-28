"use client";

type Props = {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

/** on/off pill — same language as filter chips and sort-opt in the mockup. */
export default function UiPillToggle({ on, onToggle, disabled, "aria-label": ariaLabel }: Props) {
  return (
    <button
      type="button"
      className={`pill-toggle${on ? " on" : ""}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={on}
      aria-label={ariaLabel ?? (on ? "On" : "Off")}
    >
      {on ? "on" : "off"}
    </button>
  );
}
