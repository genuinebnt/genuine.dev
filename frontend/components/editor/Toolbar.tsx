"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { directiveAttrsFromSource } from "./Directive";
import { DIRECTIVE_TEMPLATES } from "./insertTemplates";
import { uploadImage } from "../../lib/auth";

export function Toolbar({ editor }: { editor: Editor }) {
  const fileInput = useRef<HTMLInputElement>(null);
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

  const btn = (active: boolean, label: string, onClick: () => void, title?: string) => (
    <button
      type="button"
      className={`tb-btn${active ? " active" : ""}`}
      title={title ?? label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="tb">
      {btn(editor.isActive("heading", { level: 2 }), "H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      {btn(editor.isActive("heading", { level: 3 }), "H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      <span className="tb-sep" />
      {btn(editor.isActive("bold"), "B", () => editor.chain().focus().toggleBold().run(), "Bold")}
      {btn(editor.isActive("italic"), "i", () => editor.chain().focus().toggleItalic().run(), "Italic")}
      {btn(editor.isActive("strike"), "S", () => editor.chain().focus().toggleStrike().run(), "Strikethrough")}
      {btn(editor.isActive("code"), "</>", () => editor.chain().focus().toggleCode().run(), "Inline code")}
      <span className="tb-sep" />
      {btn(editor.isActive("bulletList"), "• List", () => editor.chain().focus().toggleBulletList().run())}
      {btn(editor.isActive("orderedList"), "1. List", () => editor.chain().focus().toggleOrderedList().run())}
      {btn(editor.isActive("blockquote"), "❝", () => editor.chain().focus().toggleBlockquote().run(), "Quote")}
      {btn(editor.isActive("codeBlock"), "Code", () => editor.chain().focus().toggleCodeBlock().run(), "Code block")}
      <span className="tb-sep" />
      {btn(false, "Link", () => {
        const prev = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Link URL", prev ?? "https://");
        if (url === null) return;
        if (url === "") editor.chain().focus().unsetLink().run();
        else editor.chain().focus().setLink({ href: url }).run();
      })}
      {btn(false, uploading ? "Uploading…" : "Image", () => fileInput.current?.click())}
      {btn(false, "Table", () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
      <span className="tb-sep" />
      <div className="tb-menu">
        <button type="button" className="tb-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => setMenuOpen((o) => !o)}>
          + Block ▾
        </button>
        {menuOpen && (
          <div className="tb-menu-list">
            {DIRECTIVE_TEMPLATES.map((t) => (
              <button key={t.label} type="button" onClick={() => insertDirective(t.source)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={onPickImage} />
    </div>
  );
}
