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
    <>
      <p className="eyebrow">Admin</p>
      <h1>
        Log <span>in</span>
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
      {err && <p className="muted">{err}</p>}
    </>
  );
}
