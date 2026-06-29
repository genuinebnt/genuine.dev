"use client";

import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Compact sizing for toolbar / inline contexts. */
  inline?: boolean;
};

/** Styled select — matches `select.mf-input` chevron and surface treatment. */
export default function UiSelect({ inline, className = "", children, ...props }: Props) {
  const classes = ["ui-select", "mf-input", inline ? "ui-select-inline" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <select className={classes} {...props}>
      {children}
    </select>
  );
}
