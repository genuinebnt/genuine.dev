import { API } from "../api";

const KEY = "folio_token";

export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(KEY) : null;

function notifyAuthChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("auth-change"));
}

export const setToken = (t: string) => {
  localStorage.setItem(KEY, t);
  notifyAuthChange();
};

export const clearToken = () => {
  localStorage.removeItem(KEY);
  notifyAuthChange();
};

export function logout() {
  clearToken();
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("invalid credentials");
  const { token } = (await res.json()) as { token: string };
  setToken(token);
}
