/**
 * markdown-it block rule that captures whole `:::name … :::` directive blocks
 * (depth-aware, so nested sub-directives like `:::card` inside `:::cards` are
 * kept inside their parent). Each captured block becomes a single HTML element
 * the TipTap `Directive` node parses, preserving the raw source verbatim so it
 * round-trips losslessly back to the backend renderer.
 */

// markdown-it's types aren't a project dependency; the instance is passed in.
type MarkdownIt = any;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The first token after `:::`, e.g. `callout` in `:::callout ⚠ "Gotcha"`. */
export function directiveName(source: string): string {
  const first = source.split("\n", 1)[0].trimStart();
  const rest = first.startsWith(":::") ? first.slice(3) : first;
  return rest.trim().split(/\s+/, 1)[0] ?? "";
}

export function registerDirectiveRule(md: MarkdownIt): void {
  // Avoid double-registration when several editor instances mount.
  if (md.block.ruler.__directiveRegistered) return;
  md.block.ruler.__directiveRegistered = true;

  md.block.ruler.before(
    "fence",
    "directive",
    (state: any, startLine: number, endLine: number, silent: boolean) => {
      const lineText = lineOf(state, startLine).trimEnd();
      const trimmed = lineText.trimStart();
      // Must open a directive: `:::name…`, not a bare `:::` closer.
      if (!trimmed.startsWith(":::") || trimmed.replace(/^:+/, "").trim() === "") {
        return false;
      }
      if (silent) return true;

      let depth = 1;
      let line = startLine + 1;
      for (; line < endLine; line++) {
        const t = lineOf(state, line).trim();
        if (t === ":::") {
          depth -= 1;
          if (depth === 0) break;
        } else if (t.startsWith(":::") && t.replace(/^:+/, "").trim() !== "") {
          depth += 1;
        }
      }
      const closeLine = line; // line holding the matching bare `:::` (or EOF)
      const source = state
        .getLines(startLine, Math.min(closeLine + 1, endLine), 0, false)
        .replace(/\n+$/, "");

      const token = state.push("directive", "", 0);
      token.block = true;
      token.map = [startLine, closeLine + 1];
      token.content = source;

      state.line = closeLine + 1;
      return true;
    },
  );

  md.renderer.rules.directive = (tokens: any[], idx: number) => {
    const source = tokens[idx].content as string;
    const name = directiveName(source);
    return `<div class="tt-directive" data-name="${escapeAttr(name)}" data-source="${escapeAttr(source)}"></div>`;
  };
}

function lineOf(state: any, line: number): string {
  return state.src.slice(state.bMarks[line], state.eMarks[line]);
}
