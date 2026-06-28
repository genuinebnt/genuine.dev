import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

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
