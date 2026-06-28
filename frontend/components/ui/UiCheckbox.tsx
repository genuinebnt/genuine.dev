"use client";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/** Custom checkbox — matches mockup mono/surface controls, not native OS widgets. */
export default function UiCheckbox({
  checked,
  onChange,
  label,
  disabled,
  className = "",
  "aria-label": ariaLabel,
}: Props) {
  return (
    <label className={`ui-check${disabled ? " ui-check-disabled" : ""} ${className}`.trim()}>
      <input
        type="checkbox"
        className="ui-check-input"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ui-check-box" aria-hidden />
      {label ? <span className="ui-check-label">{label}</span> : null}
    </label>
  );
}
