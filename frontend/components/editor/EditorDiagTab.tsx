"use client";

import type { EditorDiag } from "../../lib/editorDiagnostics";
import EditorCheckRow from "./EditorCheckRow";

export default function EditorDiagTab({
  diags,
  onJump,
}: {
  diags: EditorDiag[];
  onJump: (diag: EditorDiag) => void;
}) {
  const groups: { title: string; items: EditorDiag[] }[] = [
    { title: "warnings", items: diags.filter((d) => d.type === "warn") },
    { title: "checks passed", items: diags.filter((d) => d.type === "ok") },
    { title: "info", items: diags.filter((d) => d.type === "info") },
  ];

  return (
    <>
      {groups.map(
        ({ title, items }) =>
          items.length > 0 && (
            <div className="diag-group" key={title}>
              <div className="dg-h">
                {title} · {items.length}
              </div>
              {items.map((d) => (
                <EditorCheckRow key={`${title}-${d.msg}-${d.lineNum ?? ""}`} diag={d} variant="sidebar" onJump={onJump} />
              ))}
            </div>
          ),
      )}
    </>
  );
}
