"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TypewriterBrand } from "../../../components/TypewriterBrand";
import { login } from "../../../lib/auth";

const MAX_ATTEMPTS = 5;

export default function Login() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const locked = attempts >= MAX_ATTEMPTS;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked || loading) return;
    setLoading(true);
    setErr(null);
    try {
      await login("admin", passphrase);
      // Keep the button in its loading state through the redirect (no flash back).
      router.replace("/admin");
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      setErr(next >= MAX_ATTEMPTS ? "Too many attempts." : "Wrong passphrase.");
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="lc-head">
          <div className="lc-logo">
            <TypewriterBrand />
          </div>
          <div className="lc-title">Admin access</div>
          <div className="lc-sub">This area is not for you — unless it is.</div>
        </div>

        <form className="lc-body" onSubmit={onSubmit}>
          <div className="lc-field">
            <label className="lc-label">passphrase</label>
            <div className="lc-pass-wrap">
              <input
                className="lc-input"
                type={showPass ? "text" : "password"}
                placeholder="enter passphrase…"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                disabled={locked || loading}
                autoFocus
                autoComplete="current-password"
              />
              <span className="lc-show" onClick={() => setShowPass((s) => !s)}>
                {showPass ? "hide" : "show"}
              </span>
            </div>
          </div>
          <div className="lc-hint">
            <div className="lc-hint-dot" />
            <span>session persists for 30 days · stored in http-only cookie</span>
          </div>
          {err && <div className="lc-error">{err}</div>}
          <button className="lc-submit" type="submit" disabled={locked || loading || !passphrase}>
            {loading ? "Checking…" : "Enter →"}
          </button>
        </form>

        <div className="lc-footer">
          <Link className="lc-back" href="/">← back to site</Link>
          <span className="lc-attempts">{attempts} / {MAX_ATTEMPTS} attempts</span>
        </div>
      </div>
    </div>
  );
}
