import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";

import { SlashMenu, type SlashMenuHandle } from "./SlashMenu";
import { directiveAttrsFromSource } from "./Directive";
import { DIRECTIVE_TEMPLATES } from "./insertTemplates";

export type SlashItem = {
  title: string;
  subtitle?: string;
  run: (editor: Editor, range: Range) => void;
};

const insertDirective = (source: string) => (editor: Editor, range: Range) =>
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent({ type: "directive", attrs: directiveAttrsFromSource(source) })
    .run();

const COMMANDS: SlashItem[] = [
  { title: "Heading 2", subtitle: "section heading", run: (e, r) => e.chain().focus().deleteRange(r).toggleHeading({ level: 2 }).run() },
  { title: "Heading 3", subtitle: "sub-heading", run: (e, r) => e.chain().focus().deleteRange(r).toggleHeading({ level: 3 }).run() },
  { title: "Bullet list", run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
  { title: "Numbered list", run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
  { title: "Quote", run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
  { title: "Code block", subtitle: "fenced code with language", run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run() },
  { title: "Divider", run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
  { title: "Table", subtitle: "3×3 with header", run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  ...DIRECTIVE_TEMPLATES.map((t) => ({ title: t.label, subtitle: "directive block", run: insertDirective(t.source) })),
];

/** `/` command menu — insert blocks/directives without leaving the keyboard. */
export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        char: "/",
        // Only trigger at the start of an empty-ish line so `/` mid-sentence is literal.
        allowSpaces: false,
        startOfLine: true,
        command: ({ editor, range, props }) => props.run(editor, range),
        items: ({ query }) =>
          COMMANDS.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())).slice(0, 12),
        render: () => {
          let component: ReactRenderer<SlashMenuHandle> | null = null;
          let popover: HTMLDivElement | null = null;

          const place = (rect: DOMRect | null | undefined) => {
            if (!popover || !rect) return;
            popover.style.top = `${rect.bottom + 6}px`;
            popover.style.left = `${rect.left}px`;
          };

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, {
                props: { items: props.items, command: (item: SlashItem) => props.command(item) },
                editor: props.editor,
              });
              popover = document.createElement("div");
              popover.className = "slash-popover";
              popover.appendChild(component.element);
              document.body.appendChild(popover);
              place(props.clientRect?.());
            },
            onUpdate: (props) => {
              component?.updateProps({ items: props.items, command: (item: SlashItem) => props.command(item) });
              place(props.clientRect?.());
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                popover?.remove();
                popover = null;
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              popover?.remove();
              popover = null;
              component?.destroy();
              component = null;
            },
          };
        },
      }),
    ];
  },
});
