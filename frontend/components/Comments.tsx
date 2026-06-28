"use client";

import { useEffect, useState } from "react";
import { getComments, submitComment, CommentOut } from "../lib/api";

export function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<CommentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getComments(slug)
      .then((data) => {
        setComments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load comments", err);
        setError("Failed to load comments.");
        setLoading(false);
      });
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    
    setSubmitting(true);
    setError("");
    
    try {
      const newComment = await submitComment(slug, name, body);
      setComments([...comments, newComment]);
      setName("");
      setBody("");
    } catch (err) {
      console.error("Failed to submit comment", err);
      setError("Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comments">
      <div className="ch">
        {comments.length} comment{comments.length !== 1 ? "s" : ""}
      </div>
      
      {error && <div style={{ color: "var(--warn)", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}
      
      {loading ? (
        <div style={{ fontSize: "13px", color: "var(--muted)" }}>Loading comments...</div>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="ca">{c.name.charAt(0).toUpperCase()}</div>
              <div className="cb">
                <span className="cn">{c.name}</span>
                <span className="ct">{c.date}</span>
                <div className="cm">{c.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
        />
        <textarea 
          placeholder="Leave a comment..." 
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={4000}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
