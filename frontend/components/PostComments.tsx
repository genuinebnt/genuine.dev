"use client";

import { useState, type ReactNode } from "react";
import { CommentsProvider, formatRelativeTime, useComments } from "../hooks/useComments";

export function PostCommentsProvider({ slug, children }: { slug: string; children: ReactNode }) {
  return <CommentsProvider slug={slug}>{children}</CommentsProvider>;
}

export function CommentMeta() {
  const { count, loading } = useComments();
  if (loading || count === 0) return null;
  return (
    <span>
      {count} comment{count !== 1 ? "s" : ""}
    </span>
  );
}

export function Comments() {
  const { comments, loading, error, submit, submitting } = useComments();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="art-comments">
      <div className="art-cmth">
        {loading ? "Comments" : `${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
      </div>

      {error && <div className="art-cmt-error">{error}</div>}

      {loading ? (
        <div className="art-cmt-loading">Loading comments…</div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="art-cmt">
            <div className="art-cmt-av" aria-hidden>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div>
                <span className="art-cmt-name">{c.name}</span>
                <span className="art-cmt-time">{formatRelativeTime(c.date)}</span>
              </div>
              <div className="art-cmt-body">{c.body}</div>
            </div>
          </div>
        ))
      )}

      <form
        className="art-cmt-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || !body.trim()) return;
          try {
            await submit(name, body);
            setName("");
            setBody("");
          } catch {
            /* hook sets error */
          }
        }}
      >
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
        />
        <textarea
          placeholder="Leave a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={4000}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
