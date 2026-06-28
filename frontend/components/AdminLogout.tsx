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

  const isNavItem = className.includes("ts-an");

  return (
    <button type="button" className={className} onClick={onLogout} title={isNavItem ? label : undefined}>
      {isNavItem ? (
        <>
          <span className="ts-an-ic" aria-hidden>↪</span>
          <span className="ts-an-text">{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
