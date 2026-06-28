"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";

import { Directive } from "./Directive";
import { CodeBlockMeta } from "./CodeBlockMeta";
import { Toolbar } from "./Toolbar";

/**
 * WYSIWYG markdown editor. Standard rich text via TipTap/StarterKit, plus an
 * Image node (upload), tables, an attributed code block, and `:::` directive
 * blocks. Content is parsed from / serialized to Markdown so the backend render
 * pipeline stays the source of truth.
 */
export function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (markdown: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: { openOnClick: false },
      }),
      CodeBlockMeta,
      Image,
      TableKit,
      Directive,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange((editor.storage as any).markdown.getMarkdown()),
  });

  if (!editor) return <div className="tt-loading">Loading editor…</div>;

  return (
    <div className="tt-editor">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="tt-content" />
    </div>
  );
}
