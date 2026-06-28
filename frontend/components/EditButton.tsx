"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "../lib/auth";

function EditIcon() {
  return (
    <svg className="edit-fab-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/**
 * Floating "Edit" affordance shown on article pages only when an admin token is
 * present. Rendered outside grid shells so it is not clipped by panel overflow.
 */
export function EditButton({ slug }: { slug: string }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  if (!authed) return null;

  return (
    <Link href={`/admin/edit/${slug}`} className="edit-fab" aria-label="Edit this page">
      <EditIcon />
      Edit
    </Link>
  );
}
