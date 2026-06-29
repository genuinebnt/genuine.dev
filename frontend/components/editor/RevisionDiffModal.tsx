"use client";

import { useEffect, useMemo, useState } from "react";
import { diffLines } from "diff";
import { adminRevision, type RevisionDetail } from "../../lib/auth";

/**
 * Shows a line diff between a stored revision and the current editor draft, with a
 * non-destructive "restore" that loads the revision back into the editor.
 * Diff convention is git-like: `−` lines are in the revision, `+` lines are current.
 */
export default function RevisionDiffModal({
  slug,
  revisionId,
  currentBody,
  onClose,
  onRestore,
}: {
  slug: string;
  revisionId: string;
  currentBody: string;
  onClose: () => void;
  onRestore: (rev: RevisionDetail) => void;
}) {
  const [rev, setRev] = useState<RevisionDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    adminRevision(slug, revisionId)
      .then((r) => alive && setRev(r))
      .catch(() => alive && setError("Couldn't load this revision."));
    return () => {
      alive = false;
    };
  }, [slug, revisionId]);

  const lines = useMemo(() => {
    if (!rev) return [];
    return diffLines(rev.body_markdown, currentBody).flatMap((part) => {
      const cls = part.added ? "diff-add" : part.removed ? "diff-rem" : "diff-ctx";
      const sign = part.added ? "+" : part.removed ? "−" : " ";
      return part.value.replace(/\n$/, "").split("\n").map((text) => ({ cls, sign, text }));
    });
  }, [rev, currentBody]);

  const unchanged = rev && rev.body_markdown === currentBody;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div
        className="modal modal-wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Revision diff"
      >
        <div className="modal-head">
          <h2>{rev ? new Date(rev.created_at * 1000).toLocaleString() : "Revision"}</h2>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="sb-empty">{error}</div>}
          {!rev && !error && <div className="sb-empty">Loading…</div>}
          {rev && (
            <>
              <div className="diff-legend">
                <span className="dl-rem">− this revision</span>
                <span className="dl-add">+ current draft</span>
              </div>
              {unchanged ? (
                <div className="sb-empty">Identical to the current draft.</div>
              ) : (
                <pre className="diff-view">
                  {lines.map((l, i) => (
                    <span key={i} className={`diff-line ${l.cls}`}>
                      {l.sign} {l.text || " "}
                    </span>
                  ))}
                </pre>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => rev && onRestore(rev)}
            disabled={!rev}
          >
            Restore this version →
          </button>
        </div>
      </div>
    </div>
  );
}
