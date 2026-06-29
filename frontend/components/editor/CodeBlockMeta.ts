import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/** Visible line count, ignoring a trailing newline (which would add an empty last line). */
function lineCount(node: ProseMirrorNode): number {
  const lines = node.textContent.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return Math.max(lines.length, 1);
}

/** Languages exposed in the editor toolbar when a fence is focused. */
export const CODE_LANGUAGES = [
  "plaintext",
  "rust",
  "javascript",
  "typescript",
  "python",
  "sql",
  "bash",
  "json",
  "yaml",
  "markdown",
  "html",
  "css",
] as const;

/**
 * Code block with lowlight syntax highlighting plus backend fence attrs
 * (`filename`, `highlight`) preserved through the markdown round-trip.
 */
export const CodeBlockMeta = CodeBlockLowlight.extend({
  /**
   * Node view: a non-scrolling line-number gutter beside a horizontally-scrolling
   * code area. Keeping the gutter outside the scroll container pins the numbers
   * while long lines scroll. Lowlight still decorates the `<code>` contentDOM.
   */
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "cb-wrap";

      const gutter = document.createElement("div");
      gutter.className = "cb-gutter";
      gutter.setAttribute("contenteditable", "false");

      const scroll = document.createElement("div");
      scroll.className = "cb-scroll";
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      pre.appendChild(code);
      scroll.appendChild(pre);

      dom.append(gutter, scroll);

      const renderGutter = (n: ProseMirrorNode) => {
        const count = lineCount(n);
        gutter.textContent = Array.from({ length: count }, (_, i) => String(i + 1)).join("\n");
      };
      renderGutter(node);

      return {
        dom,
        contentDOM: code,
        update: (updated: ProseMirrorNode) => {
          if (updated.type.name !== node.type.name) return false;
          renderGutter(updated);
          return true;
        },
        ignoreMutation: (mutation: MutationRecord | { type: "selection"; target: Node }) =>
          gutter === mutation.target || gutter.contains(mutation.target),
      };
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      filename: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-filename"),
        renderHTML: (attrs) => (attrs.filename ? { "data-filename": attrs.filename } : {}),
      },
      highlight: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-highlight"),
        renderHTML: (attrs) => (attrs.highlight ? { "data-highlight": attrs.highlight } : {}),
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const language = node.attrs.language || "";
          let info = language;
          if (node.attrs.filename) info += ` filename="${node.attrs.filename}"`;
          if (node.attrs.highlight) info += ` highlight="${node.attrs.highlight}"`;
          state.write("```" + info + "\n");
          state.text(node.textContent, false);
          state.ensureNewLine();
          state.write("```");
          state.closeBlock(node);
        },
        parse: {
          setup(md: any) {
            const defaultFence = md.renderer.rules.fence;
            md.renderer.rules.fence = (
              tokens: any[],
              idx: number,
              options: any,
              env: any,
              self: any,
            ) => {
              const info = (tokens[idx].info || "").trim();
              const html = defaultFence(tokens, idx, options, env, self);
              const filename = info.match(/filename="([^"]*)"/)?.[1];
              const highlight = info.match(/highlight="([^"]*)"/)?.[1];
              if (!filename && !highlight) return html;
              const attrs = [
                filename ? `data-filename="${filename}"` : "",
                highlight ? `data-highlight="${highlight}"` : "",
              ]
                .filter(Boolean)
                .join(" ");
              return html.replace(/^<pre/, `<pre ${attrs}`);
            };
          },
        },
      },
    };
  },
});
