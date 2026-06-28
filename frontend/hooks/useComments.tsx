"use client";

/** One GET /comments per post — shared by CommentMeta (count) and Comments (list). */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getComments, submitComment, type CommentOut } from "../lib/api";

type CommentsContextValue = {
  comments: CommentOut[];
  count: number;
  loading: boolean;
  error: string;
  submit: (name: string, body: string) => Promise<void>;
  submitting: boolean;
};

const CommentsContext = createContext<CommentsContextValue | null>(null);

export function useComments(): CommentsContextValue {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error("useComments must be used within CommentsProvider");
  return ctx;
}

export function CommentsProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [comments, setComments] = useState<CommentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getComments(slug)
      .then((data) => {
        setComments(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load comments.");
        setLoading(false);
      });
  }, [slug]);

  async function submit(name: string, body: string) {
    setSubmitting(true);
    setError("");
    try {
      const newComment = await submitComment(slug, name, body);
      setComments((prev) => [...prev, newComment]);
    } catch {
      setError("Failed to submit comment.");
      throw new Error("submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CommentsContext.Provider
      value={{
        comments,
        count: comments.length,
        loading,
        error,
        submit,
        submitting,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const then = new Date(dateStr).getTime();
    const diff = Date.now() - then;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days >= 1) return `${days} day${days === 1 ? "" : "s"} ago`;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    return "just now";
  } catch {
    return dateStr;
  }
}
