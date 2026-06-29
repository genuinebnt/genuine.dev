"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRevisions, type RevisionDetail, type RevisionItem } from "../../lib/auth";
import RevisionDiffModal from "./RevisionDiffModal";

function relativeTime(unixSeconds: number): string {
  const secs = Math.max(0, Date.now() / 1000 - unixSeconds);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

/** Editor side-panel tab: server-side version history with diff + restore. */
export default function EditorHistoryTab({
  slug,
  isNewDoc,
  refreshKey,
  getCurrentBody,
  onRestore,
}: {
  slug: string;
  isNewDoc: boolean;
  refreshKey: number;
  getCurrentBody: () => string;
  onRestore: (rev: RevisionDetail) => void;
}) {
  const [revisions, setRevisions] = useState<RevisionItem[] | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isNewDoc || !slug.trim()) {
      setRevisions([]);
      return;
    }
    setError("");
    adminRevisions(slug)
      .then(setRevisions)
      .catch(() => setError("Couldn't load history."));
  }, [slug, isNewDoc]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (isNewDoc) {
    return <div className="sb-empty">Save this document to start tracking version history.</div>;
  }
  if (error) return <div className="sb-empty">{error}</div>;
  if (revisions === null) return <div className="sb-empty">Loading…</div>;
  if (revisions.length === 0) {
    return <div className="sb-empty">No revisions yet — your next save creates the first.</div>;
  }

  return (
    <div className="rev-list">
      {revisions.map((r, i) => (
        <button key={r.id} type="button" className="rev-row" onClick={() => setOpenId(r.id)}>
          <span className="rev-v">v{revisions.length - i}</span>
          <span className="rev-main">
            <span className="rev-title">{r.title || "Untitled"}</span>
            <span className="rev-meta">
              {relativeTime(r.created_at)} · {r.status}
            </span>
          </span>
          {i === 0 && <span className="rev-cur">latest</span>}
        </button>
      ))}
      {openId && (
        <RevisionDiffModal
          slug={slug}
          revisionId={openId}
          currentBody={getCurrentBody()}
          onClose={() => setOpenId(null)}
          onRestore={(rev) => {
            onRestore(rev);
            setOpenId(null);
          }}
        />
      )}
    </div>
  );
}
