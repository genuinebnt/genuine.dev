"use client";

import EditorCheckRow from "./EditorCheckRow";
import ScheduleDateTimeInput from "../ui/ScheduleDateTimeInput";
import type { EditorDiag } from "../../lib/editorDiagnostics";

type PublishMode = "now" | "schedule";

export default function PublishModal({
  open,
  checks,
  canonicalUrl,
  publishMode,
  scheduleDate,
  saving,
  onClose,
  onSaveDraft,
  onPublish,
  onModeChange,
  onScheduleDateChange,
  onJumpTo,
}: {
  open: boolean;
  checks: EditorDiag[];
  canonicalUrl: string;
  publishMode: PublishMode;
  scheduleDate: string;
  saving: boolean;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onModeChange: (mode: PublishMode) => void;
  onScheduleDateChange: (date: string) => void;
  onJumpTo: (diag: EditorDiag) => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="publish-modal-title"
      >
        <div className="modal-head">
          <h2 id="publish-modal-title">Publish post</h2>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 14 }}>
            <div className="publish-checks-label">pre-publish checks</div>
            {checks.map((c) => (
              <EditorCheckRow key={`${c.type}-${c.msg}-${c.lineNum ?? ""}`} diag={c} variant="modal" onJump={onJumpTo} />
            ))}
          </div>

          <div className="field-group">
            <div className="fg-label">publish mode</div>
            <div className="radio-row">
              <button
                type="button"
                className={`radio-opt${publishMode === "now" ? " sel" : ""}`}
                onClick={() => onModeChange("now")}
              >
                <div className="ro-label">{publishMode === "now" ? "● Now" : "○ Now"}</div>
                <div className="ro-desc">Goes live immediately.</div>
              </button>
              <button
                type="button"
                className={`radio-opt${publishMode === "schedule" ? " sel" : ""}`}
                onClick={() => onModeChange("schedule")}
              >
                <div className="ro-label">{publishMode === "schedule" ? "● Schedule" : "○ Schedule"}</div>
                <div className="ro-desc">Save as draft with a target date.</div>
              </button>
            </div>
          </div>

          {publishMode === "schedule" && (
            <div className="field-group">
              <div className="fg-label">publish on</div>
              <ScheduleDateTimeInput
                inputClass="fg-input"
                value={scheduleDate}
                onChange={onScheduleDateChange}
              />
            </div>
          )}

          <div className="field-group">
            <div className="fg-label">canonical url (auto-filled)</div>
            <input className="fg-input" value={canonicalUrl} readOnly style={{ color: "var(--faint)" }} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={onSaveDraft} disabled={saving}>
            Save draft
          </button>
          <button type="button" className="btn primary" onClick={onPublish} disabled={saving}>
            {saving ? "Saving…" : publishMode === "now" ? "Publish now →" : "Schedule draft →"}
          </button>
        </div>
      </div>
    </div>
  );
}
