"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminSave, type EditDoc } from "../lib/auth";

const blank: EditDoc = {
  slug: "",
  kind: "post",
  title: "",
  summary: null,
  status: "draft",
  body_markdown: "",
};

export default function EditorForm({ initial = blank }: { initial?: EditDoc }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await adminSave({
        slug: String(f.get("slug")),
        kind: String(f.get("kind")),
        title: String(f.get("title")),
        summary: String(f.get("summary")),
        status: String(f.get("status")),
        body: String(f.get("body")),
      });
      router.push("/admin");
    } catch {
      setErr("Save failed — are you logged in?");
    }
  }

  return (
    <>
      <h1>Editor</h1>
      <form className="admin-form" onSubmit={onSubmit}>
        <input name="title" placeholder="Title" defaultValue={initial.title} />
        <input
          name="slug"
          placeholder="slug (blank = from title)"
          defaultValue={initial.slug}
        />
        <input
          name="summary"
          placeholder="Summary"
          defaultValue={initial.summary ?? ""}
        />
        <div className="row">
          <select name="kind" defaultValue={initial.kind}>
            <option value="post">post</option>
            <option value="project">project</option>
            <option value="page">page</option>
          </select>
          <select name="status" defaultValue={initial.status}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
        <textarea
          name="body"
          rows={20}
          placeholder="# Markdown…"
          defaultValue={initial.body_markdown}
        />
        <button type="submit">Save</button>
      </form>
      {err && <p className="muted">{err}</p>}
    </>
  );
}
