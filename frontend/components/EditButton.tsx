"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "../lib/auth";

/**
 * Floating "Edit" affordance shown on article pages only when an admin token is
 * present. Routes to the editor pre-loaded with this document.
 */
export function EditButton({ slug }: { slug: string }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getToken());
  }, []);

  if (!authed) return null;

  return (
    <Link href={`/admin/edit/${slug}`} className="edit-fab" aria-label="Edit this page">
      ✎ Edit
    </Link>
  );
}
