"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";

import { Directive } from "./Directive";
import { CodeBlockMeta } from "./CodeBlockMeta";
import { Toolbar } from "./Toolbar";

const lowlight = createLowlight(common);

/** tiptap-markdown storage is added by the Markdown extension at runtime. */
export function editorMarkdown(editor: Editor): string {
  return (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();
}

/**
 * WYSIWYG markdown editor. Standard rich text via TipTap/StarterKit, plus an
 * Image node (upload), tables, an attributed code block, and `:::` directive
 * blocks. Content is parsed from / serialized to Markdown so the backend render
 * pipeline stays the source of truth.
 */
export function RichEditor({
  value,
  onChange,
  onEditorReady,
  showPreview,
  onTogglePreview,
  onSaveDraft,
  saving,
}: {
  value: string;
  onChange: (markdown: string) => void;
  onEditorReady?: (editor: Editor) => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  onSaveDraft?: () => void;
  saving?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: { openOnClick: false },
      }),
      CodeBlockMeta.configure({ lowlight, defaultLanguage: "plaintext" }),
      Image,
      TableKit,
      Directive,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editorMarkdown(editor)),
  });

  useEffect(() => {
    if (editor) onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  if (!editor) return <div className="tt-loading">Loading editor…</div>;

  return (
    <div className="tt-editor">
      <Toolbar
        editor={editor}
        showPreview={showPreview}
        onTogglePreview={onTogglePreview}
        onSaveDraft={onSaveDraft}
        saving={saving}
      />
      <EditorContent editor={editor} className="tt-content" />
    </div>
  );
}
