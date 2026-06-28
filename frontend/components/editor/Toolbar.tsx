"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { CODE_LANGUAGES } from "./CodeBlockMeta";
import { directiveAttrsFromSource } from "./Directive";
import { DIRECTIVE_TEMPLATES } from "./insertTemplates";
import { uploadImage } from "../../lib/auth";

const ASIDE_SRC = ':::aside 🦀 "Ferris\' hot tip"\nA personal note from the mascot.\n:::';
const CALLOUT_SRC = ':::callout ⚠ "Heads up"\nSomething worth flagging.\n:::';

export function Toolbar({
  editor,
  showPreview,
  onTogglePreview,
  onSaveDraft,
  saving,
}: {
  editor: Editor;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  onSaveDraft?: () => void;
  saving?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const insertDirective = (source: string) => {
    editor.chain().focus().insertContent({ type: "directive", attrs: directiveAttrsFromSource(source) }).run();
    setMenuOpen(false);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const btn = (active: boolean, label: string, onClick: () => void, title?: string, extraClass = "") => (
    <button
      type="button"
      className={`tb-btn${active ? " active" : ""}${extraClass ? ` ${extraClass}` : ""}`}
      title={title ?? label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="toolbar-row">
      <div className="tb-group">
        {btn(false, "↩", () => editor.chain().focus().undo().run(), "Undo")}
        {btn(false, "↪", () => editor.chain().focus().redo().run(), "Redo")}
      </div>
      <span className="tb-sep" />
      <div className="tb-group">
        {btn(editor.isActive("bold"), "B", () => editor.chain().focus().toggleBold().run(), "Bold")}
        {btn(editor.isActive("italic"), "I", () => editor.chain().focus().toggleItalic().run(), "Italic", "tb-italic")}
        {btn(editor.isActive("strike"), "S", () => editor.chain().focus().toggleStrike().run(), "Strikethrough", "tb-strike")}
      </div>
      <span className="tb-sep" />
      <div className="tb-group">
        {btn(editor.isActive("heading", { level: 1 }), "H1", () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        {btn(editor.isActive("heading", { level: 2 }), "H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        {btn(editor.isActive("heading", { level: 3 }), "H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      </div>
      <span className="tb-sep" />
      <div className="tb-group">
        {btn(editor.isActive("code"), "`code`", () => editor.chain().focus().toggleCode().run(), "Inline code")}
        {btn(editor.isActive("codeBlock"), "```block", () => editor.chain().focus().toggleCodeBlock().run(), "Code block")}
        {btn(false, "::aside", () => insertDirective(ASIDE_SRC), "Character aside")}
        {btn(false, "::callout", () => insertDirective(CALLOUT_SRC), "Callout")}
      </div>
      <span className="tb-sep" />
      <div className="tb-group">
        {btn(false, "↗ link", () => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Link URL", prev ?? "https://");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: url }).run();
        }, "Insert link", "action")}
        <label
          className="tb-btn action"
          title="Upload image"
          onMouseDown={(e) => e.preventDefault()}
        >
          {uploading ? "…" : "⊞ img"}
          <input type="file" accept="image/*" hidden onChange={onPickImage} disabled={uploading} />
        </label>
      </div>
      <span className="tb-sep" />
      <div className="tb-menu">
        <button type="button" className="tb-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => setMenuOpen((o) => !o)}>
          + Block ▾
        </button>
        {menuOpen && (
          <div className="tb-menu-list">
            {DIRECTIVE_TEMPLATES.filter((t) => !["Callout", "Character aside"].includes(t.label)).map((t) => (
              <button key={t.label} type="button" onClick={() => insertDirective(t.source)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {editor.isActive("codeBlock") && (
        <>
          <span className="tb-sep" />
          <div className="tb-group tb-code-meta">
            <select
              className="tb-code-lang"
              title="Language"
              value={editor.getAttributes("codeBlock").language || "plaintext"}
              onChange={(e) =>
                editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run()
              }
            >
              {CODE_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <input
              className="tb-code-file"
              type="text"
              placeholder="filename.rs"
              title="Optional filename"
              value={editor.getAttributes("codeBlock").filename || ""}
              onChange={(e) =>
                editor
                  .chain()
                  .focus()
                  .updateAttributes("codeBlock", { filename: e.target.value || null })
                  .run()
              }
            />
          </div>
        </>
      )}

      <div className="tb-right">
        {onTogglePreview !== undefined && (
          <button
            type="button"
            className={`preview-btn${showPreview ? " active" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onTogglePreview}
          >
            split
          </button>
        )}
        {onSaveDraft && (
          <button type="button" className="save-btn" onClick={onSaveDraft} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </button>
        )}
      </div>
    </div>
  );
}
