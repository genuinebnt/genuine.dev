"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";

/**
 * Floating formatting toolbar shown on text selection. Quick inline actions live
 * here so the sidebar isn't needed for trivial formatting. Hidden for code blocks,
 * images, and directive nodes — those use the contextual inspector instead.
 */
export function EditorBubbleMenu({ editor }: { editor: Editor }) {
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const btn = (active: boolean, label: string, onClick: () => void, title: string) => (
    <button
      type="button"
      className={`bm-btn${active ? " active" : ""}`}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top" }}
      shouldShow={({ editor: ed, from, to }) =>
        from !== to &&
        !ed.isActive("codeBlock") &&
        !ed.isActive("image") &&
        !ed.isActive("directive")
      }
    >
      <div className="bubble-menu">
        {btn(editor.isActive("bold"), "B", () => editor.chain().focus().toggleBold().run(), "Bold")}
        {btn(editor.isActive("italic"), "i", () => editor.chain().focus().toggleItalic().run(), "Italic")}
        {btn(editor.isActive("strike"), "S", () => editor.chain().focus().toggleStrike().run(), "Strikethrough")}
        {btn(editor.isActive("code"), "</>", () => editor.chain().focus().toggleCode().run(), "Inline code")}
        {btn(editor.isActive("link"), "🔗", setLink, "Link")}
        <span className="bm-sep" />
        {btn(editor.isActive("heading", { level: 2 }), "H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "Heading 2")}
        {btn(editor.isActive("heading", { level: 3 }), "H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "Heading 3")}
        {btn(editor.isActive("blockquote"), "❝", () => editor.chain().focus().toggleBlockquote().run(), "Quote")}
        {btn(editor.isActive("bulletList"), "•", () => editor.chain().focus().toggleBulletList().run(), "Bullet list")}
      </div>
    </BubbleMenu>
  );
}
