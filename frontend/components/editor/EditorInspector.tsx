"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { CODE_LANGUAGES } from "./CodeBlockMeta";
import { uploadImage } from "../../lib/auth";
import UiSelect from "../ui/UiSelect";

export type InspectorType = "image" | "codeBlock" | "link";

/** Which configurable element (if any) the current selection sits on. */
export function describeSelection(editor: Editor): InspectorType | null {
  if (editor.isActive("image")) return "image";
  if (editor.isActive("codeBlock")) return "codeBlock";
  if (editor.isActive("link")) return "link";
  return null;
}

const LABELS: Record<InspectorType, string> = {
  image: "Image",
  codeBlock: "Code block",
  link: "Link",
};

/**
 * Contextual settings for the selected element — rendered in place of the side-panel
 * tabs (panel takeover) so deep config has room without adding a permanent tab.
 * Remounted per selection (via `key`) so fields seed from the node's attributes.
 */
export function EditorInspector({
  editor,
  type,
  onBack,
}: {
  editor: Editor;
  type: InspectorType;
  onBack: () => void;
}) {
  return (
    <div className="insp">
      <div className="insp-head">
        <button type="button" className="insp-back" onClick={onBack} title="Back to panel">
          ‹ panel
        </button>
        <span className="insp-title">{LABELS[type]}</span>
      </div>
      <div className="insp-body">
        {type === "image" && <ImageInspector editor={editor} />}
        {type === "codeBlock" && <CodeInspector editor={editor} />}
        {type === "link" && <LinkInspector editor={editor} />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="tt-field">
      <span className="tt-field-label">{label}</span>
      {children}
    </label>
  );
}

function ImageInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes("image");
  const [alt, setAlt] = useState<string>(attrs.alt ?? "");
  const [title, setTitle] = useState<string>(attrs.title ?? "");
  const [busy, setBusy] = useState(false);

  const update = (patch: Record<string, unknown>) =>
    editor.chain().focus(undefined, { scrollIntoView: false }).updateAttributes("image", patch).run();

  async function replace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      update({ src: await uploadImage(file) });
    } catch {
      alert("Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {attrs.src && <img className="insp-preview" src={attrs.src} alt={alt || "preview"} />}
      <Field label="Alt text (accessibility)">
        <input
          value={alt}
          onChange={(e) => {
            setAlt(e.target.value);
            update({ alt: e.target.value });
          }}
        />
      </Field>
      <Field label="Title (hover tooltip)">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            update({ title: e.target.value || null });
          }}
        />
      </Field>
      <label className="btn-sm">
        {busy ? "Uploading…" : "Replace image"}
        <input type="file" accept="image/*" hidden onChange={replace} />
      </label>
    </>
  );
}

function CodeInspector({ editor }: { editor: Editor }) {
  const attrs = editor.getAttributes("codeBlock");
  const [language, setLanguage] = useState<string>(attrs.language ?? "plaintext");
  const [filename, setFilename] = useState<string>(attrs.filename ?? "");
  const [highlight, setHighlight] = useState<string>(attrs.highlight ?? "");

  const update = (patch: Record<string, unknown>) =>
    editor.chain().focus(undefined, { scrollIntoView: false }).updateAttributes("codeBlock", patch).run();

  return (
    <>
      <Field label="Language">
        <UiSelect
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            update({ language: e.target.value });
          }}
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </UiSelect>
      </Field>
      <Field label="Filename (header label)">
        <input
          placeholder="e.g. main.rs"
          value={filename}
          onChange={(e) => {
            setFilename(e.target.value);
            update({ filename: e.target.value || null });
          }}
        />
      </Field>
      <Field label="Highlight lines (e.g. 1,3-5)">
        <input
          placeholder="1,3-5"
          value={highlight}
          onChange={(e) => {
            setHighlight(e.target.value);
            update({ highlight: e.target.value || null });
          }}
        />
      </Field>
    </>
  );
}

function LinkInspector({ editor }: { editor: Editor }) {
  const [href, setHref] = useState<string>(editor.getAttributes("link").href ?? "");

  return (
    <>
      <Field label="URL">
        <input
          value={href}
          onChange={(e) => {
            setHref(e.target.value);
            editor.chain().focus(undefined, { scrollIntoView: false }).extendMarkRange("link").setLink({ href: e.target.value }).run();
          }}
        />
      </Field>
      <button
        type="button"
        className="btn-sm danger"
        onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
      >
        Remove link
      </button>
    </>
  );
}
