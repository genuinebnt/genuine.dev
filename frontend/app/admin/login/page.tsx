"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../../lib/auth";

export default function Login() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await login(String(f.get("username")), String(f.get("password")));
      router.push("/admin");
    } catch {
      setErr("Invalid credentials");
    }
  }

  return (
    <div className="auth-card">
      <div className="eyebrow">Admin</div>
      <h1 className="ph-title">
        Log <span style={{ color: "var(--acc)" }}>in</span>
      </h1>
      <form className="admin-form" onSubmit={onSubmit}>
        <input name="username" placeholder="username" autoComplete="username" />
        <input
          type="password"
          name="password"
          placeholder="password"
          autoComplete="current-password"
        />
        <button type="submit">Log in</button>
      </form>
      {err && <p className="form-error">{err}</p>}
    </div>
  );
}
