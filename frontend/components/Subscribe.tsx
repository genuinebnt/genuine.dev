"use client";

import { useState } from "react";
import { API } from "../lib/api";

export default function Subscribe() {
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    try {
      const res = await fetch(`${API}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setMsg(res.ok ? (data.message ?? "Check your email.") : "Enter a valid email.");
    } catch {
      setMsg("Something went wrong.");
    }
  }

  return (
    <div className="footer-news">
      <span className="muted">Get new posts by email:</span>
      <form className="subscribe" onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="you@example.com" required />
        <button type="submit">Subscribe</button>
      </form>
      {msg && <span className="muted sub-msg">{msg}</span>}
    </div>
  );
}
