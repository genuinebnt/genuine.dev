"use client";

import { clampPage, pageCount, pageRange } from "../../lib/pagination";

type Props = {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/** Prev/next pager — hidden when everything fits on one page. */
export default function Pagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: Props) {
  if (totalItems <= pageSize) return null;

  const pages = pageCount(totalItems, pageSize);
  const current = clampPage(page, totalItems, pageSize);
  const { start, end } = pageRange(current, totalItems, pageSize);

  return (
    <nav className={`pagination${className ? ` ${className}` : ""}`} aria-label="Pagination">
      <span className="pg-range">
        {start}–{end} of {totalItems}
      </span>
      <div className="pg-controls">
        <button
          type="button"
          className="pg-btn"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          ← prev
        </button>
        <span className="pg-status">
          {current} / {pages}
        </span>
        <button
          type="button"
          className="pg-btn"
          disabled={current >= pages}
          onClick={() => onPageChange(current + 1)}
        >
          next →
        </button>
      </div>
    </nav>
  );
}
