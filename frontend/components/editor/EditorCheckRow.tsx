import type { EditorDiag } from "../../lib/editorDiagnostics";

type Variant = "sidebar" | "modal";

export default function EditorCheckRow({
  diag,
  variant,
  onJump,
}: {
  diag: EditorDiag;
  variant: Variant;
  onJump?: (diag: EditorDiag) => void;
}) {
  if (variant === "modal") {
    return (
      <div className="check-row">
        <span className={`cr-ic ${diag.type === "warn" ? "warn" : "ok"}`}>
          {diag.type === "warn" ? "▲" : "✓"}
        </span>
        <div className="cr-body">
          <div className="cr-label">{diag.msg}</div>
          <div className="cr-sub">{diag.sub}</div>
          {diag.type === "warn" && diag.fixLabel && onJump && (
            <button type="button" className="cr-action" onClick={() => onJump(diag)}>
              go to editor
            </button>
          )}
        </div>
      </div>
    );
  }

  const icon = diag.type === "warn" ? "▲" : diag.type === "ok" ? "✓" : "i";

  return (
    <div className={`diag-item ${diag.type === "warn" ? "warn-d" : diag.type}`}>
      <span className="di-ic">{icon}</span>
      <div className="di-body">
        <div className="di-msg">{diag.msg}</div>
        <div className="di-sub">{diag.sub}</div>
        {diag.fixLabel && onJump && (
          <button type="button" className="di-fix" onClick={() => onJump(diag)}>
            {diag.fixLabel}
          </button>
        )}
      </div>
      {diag.lineNum != null && <span className="di-loc">L{diag.lineNum}</span>}
    </div>
  );
}
