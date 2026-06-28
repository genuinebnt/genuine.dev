"use client";

import { use, useEffect, useState } from "react";
import EditorForm from "../../../../components/EditorForm";
import { adminGet, type EditDoc } from "../../../../lib/auth";

export default function EditDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [doc, setDoc] = useState<EditDoc | null | "error">(null);

  useEffect(() => {
    adminGet(slug)
      .then(setDoc)
      .catch(() => setDoc("error"));
  }, [slug]);

  if (doc === "error") return <p className="muted">Not found or not authorized.</p>;
  if (doc === null) return <p className="muted">Loading…</p>;
  return <EditorForm initial={doc} />;
}
