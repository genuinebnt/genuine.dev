import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { DirectiveView } from "./DirectiveView";
import { directiveName, registerDirectiveRule } from "./markdownDirectives";

/**
 * A `:::name … :::` directive block. The raw source is stored verbatim on the
 * node, so it round-trips losslessly to the backend renderer regardless of how
 * rich the editing UI is. The React NodeView (`DirectiveView`) presents a
 * structured form per directive family, falling back to source editing.
 */
export const Directive = Node.create({
  name: "directive",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      name: { default: "" },
      source: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.tt-directive",
        getAttrs: (el) => {
          const node = el as HTMLElement;
          return {
            name: node.getAttribute("data-name") ?? "",
            source: node.getAttribute("data-source") ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { class: "tt-directive" },
        {
          "data-name": HTMLAttributes.name,
          "data-source": HTMLAttributes.source,
        },
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DirectiveView);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(node.attrs.source);
          state.closeBlock(node);
        },
        parse: {
          setup(md: any) {
            registerDirectiveRule(md);
          },
        },
      },
    };
  },
});

/** Insert (or replace) a directive node carrying the given source. */
export function directiveAttrsFromSource(source: string) {
  return { name: directiveName(source), source };
}
