"use client";

import type { OutlineBlock, OutlineHeading } from "../../lib/editorDiagnostics";

const BLOCK_CLASS: Record<OutlineBlock["kind"], string> = {
  aside: "oi-block-aside",
  callout: "oi-block-callout",
  code: "oi-block-code",
};

export default function EditorOutlineTab({
  headings,
  blocks,
  onJump,
}: {
  headings: OutlineHeading[];
  blocks: OutlineBlock[];
  onJump: (lineNum: number) => void;
}) {
  if (headings.length === 0 && blocks.length === 0) {
    return (
      <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--faint)" }}>
        No headings yet.
      </p>
    );
  }

  return (
    <>
      <div className="sb-h">document structure</div>
      {headings.map((h) => (
        <button
          type="button"
          key={`${h.lineNum}-${h.text}`}
          className={`outline-item outline-item-btn${h.level === 3 ? " oi-sub2" : h.level === 2 ? " oi-sub" : ""}`}
          onClick={() => onJump(h.lineNum)}
        >
          <span className="oi-mark">H{h.level}</span>
          <span className={`oi-title${h.level === 1 ? " h1" : ""}${h.warn ? " oi-warn" : ""}`}>
            {h.text}
            {h.warn ? " ⚠" : ""}
          </span>
          <span className="oi-line">L{h.lineNum}</span>
        </button>
      ))}
      {blocks.length > 0 && (
        <div className="outline-blocks-section">
          <div className="sb-h">directives &amp; blocks</div>
          {blocks.map((b) => (
            <button
              type="button"
              key={`${b.kind}-${b.lineNum}-${b.label}`}
              className={`outline-item outline-item-btn ${BLOCK_CLASS[b.kind]}`}
              onClick={() => onJump(b.lineNum)}
            >
              <span className="oi-mark">{b.kind === "code" ? "```" : "::"}</span>
              <span className="oi-title">{b.label}</span>
              <span className="oi-line">L{b.lineNum}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
