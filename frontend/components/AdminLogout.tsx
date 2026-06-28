"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "../lib/auth";

type Props = {
  className?: string;
  redirectTo?: string;
  label?: string;
};

/** Clears the JWT from localStorage and returns to the public site. */
export default function AdminLogout({
  className = "btn",
  redirectTo = "/",
  label = "Log out",
}: Props) {
  const router = useRouter();

  function onLogout() {
    clearToken();
    router.replace(redirectTo);
  }

  return (
    <button type="button" className={className} onClick={onLogout}>
      {className.includes("ts-an") && <span aria-hidden>↪</span>}
      {label}
    </button>
  );
}
