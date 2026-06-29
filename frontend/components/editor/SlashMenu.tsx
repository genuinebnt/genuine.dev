"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { SlashItem } from "./slashCommands";

export type SlashMenuHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

/** Slash-menu popup. Exposes `onKeyDown` so the suggestion plugin can delegate
 * arrow/enter navigation while ProseMirror keeps focus. */
export const SlashMenu = forwardRef<
  SlashMenuHandle,
  { items: SlashItem[]; command: (item: SlashItem) => void }
>(function SlashMenu({ items, command }, ref) {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowDown") {
        setIndex((i) => (i + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        setIndex((i) => (i + items.length - 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter") {
        if (items[index]) command(items[index]);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="slash-menu">
        <div className="slash-empty">No matches</div>
      </div>
    );
  }

  return (
    <div className="slash-menu">
      {items.map((item, i) => (
        <button
          key={item.title}
          type="button"
          className={`slash-item${i === index ? " active" : ""}`}
          onMouseEnter={() => setIndex(i)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command(item)}
        >
          <span className="slash-title">{item.title}</span>
          {item.subtitle && <span className="slash-sub">{item.subtitle}</span>}
        </button>
      ))}
    </div>
  );
});
