/**
 * Pure parse/serialize for the `:::` directive families, mirroring the grammar
 * the backend renderer (`backend/src/infra/render.rs`) expects. The editor's
 * NodeViews edit these structured models; serialization always reproduces valid
 * directive markdown so content round-trips losslessly.
 */

export type Callout = { kind: "callout"; icon: string; title: string; body: string };
export type Aside = { kind: "aside"; emoji: string; title: string; body: string };
export type TimelineItem = { year: string; title: string; desc: string };
export type Timeline = { kind: "timeline"; items: TimelineItem[] };
export type Card = { color: string; name: string; owns: string; tags: string[]; details: string };
export type Cards = { kind: "cards"; cards: Card[] };
export type GridItem = { service: string; body: string };
export type Grid = { kind: "grid"; items: GridItem[] };
export type Signal = { title: string; body: string };
export type Signals = { kind: "signals"; items: Signal[] };
export type Decision = { title: string; body: string };
export type Accordion = {
  kind: "accordion";
  num: string;
  title: string;
  subtitle: string;
  decisions: Decision[];
};
export type Concept = { domain: string; name: string; body: string };
export type Tab = { label: string; concepts: Concept[] };
export type Tabs = { kind: "tabs"; tabs: Tab[] };
/** Anything without a dedicated structured editor — edited as raw source. */
export type Raw = { kind: "raw"; name: string; source: string };

export type Directive =
  | Callout
  | Aside
  | Timeline
  | Cards
  | Grid
  | Signals
  | Accordion
  | Tabs
  | Raw;

/** Families that have a structured form editor. */
export const STRUCTURED = new Set([
  "callout",
  "aside",
  "timeline",
  "cards",
  "grid",
  "signals",
  "accordion",
  "tabs",
]);

const stripQuotes = (s: string) => s.trim().replace(/^"|"$/g, "");

/** Split a directive source into its first line's args and inner body. */
function argsAndBody(source: string): { args: string; body: string } {
  const lines = source.split("\n");
  const first = lines[0].trim().replace(/^:::/, "").trim();
  const sp = first.indexOf(" ");
  const args = sp === -1 ? "" : first.slice(sp + 1).trim();

  let end = lines.length;
  for (let i = lines.length - 1; i > 0; i--) {
    if (lines[i].trim() === ":::") {
      end = i;
      break;
    }
  }
  return { args, body: lines.slice(1, end).join("\n") };
}

/** Depth-aware split of `:::name arg … :::` sub-blocks inside a body. */
function subDirectives(body: string, name: string): { arg: string; body: string }[] {
  const open = `:::${name}`;
  const lines = body.split("\n");
  const out: { arg: string; body: string }[] = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === open || t.startsWith(`${open} `)) {
      const arg = t.slice(open.length).trim();
      const sub: string[] = [];
      let depth = 1;
      i++;
      for (; i < lines.length; i++) {
        const u = lines[i].trim();
        if (u === ":::") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        } else if (u.startsWith(":::") && u.replace(/^:+/, "").trim() !== "") {
          depth++;
        }
        sub.push(lines[i]);
      }
      out.push({ arg, body: sub.join("\n").trim() });
    } else {
      i++;
    }
  }
  return out;
}

export function parseDirective(name: string, source: string): Directive {
  switch (name) {
    case "callout": {
      const { args, body } = argsAndBody(source);
      const sp = args.indexOf(" ");
      const icon = sp === -1 ? "ℹ" : args.slice(0, sp);
      const title = stripQuotes(sp === -1 ? args : args.slice(sp + 1));
      return { kind: "callout", icon, title, body };
    }
    case "aside": {
      const { args, body } = argsAndBody(source);
      const sp = args.indexOf(" ");
      const emoji = sp === -1 ? "🦀" : args.slice(0, sp);
      const title = stripQuotes(sp === -1 ? args : args.slice(sp + 1));
      return { kind: "aside", emoji, title, body };
    }
    case "timeline": {
      const { body } = argsAndBody(source);
      const items = body
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const sp = line.indexOf(" ");
          const year = sp === -1 ? "" : line.slice(0, sp);
          const rest = sp === -1 ? line : line.slice(sp + 1);
          const dash = rest.indexOf(" — ");
          return dash === -1
            ? { year, title: rest, desc: "" }
            : { year, title: rest.slice(0, dash), desc: rest.slice(dash + 3) };
        });
      return { kind: "timeline", items };
    }
    case "cards": {
      const { body } = argsAndBody(source);
      const cards = subDirectives(body, "card").map(({ arg, body: cb }) => {
        const parts = arg.split('"');
        const tags = cb
          .split("\n")
          .filter((l) => l.trim().startsWith("-"))
          .map((l) => l.trim().replace(/^-\s*/, ""));
        const details = cb
          .split("\n")
          .filter((l) => l.trim() && !l.trim().startsWith("-"))
          .join(" ")
          .trim();
        return {
          color: (parts[0] ?? "").trim(),
          name: (parts[1] ?? "").trim(),
          owns: (parts[3] ?? "").trim(),
          tags,
          details,
        };
      });
      return { kind: "cards", cards };
    }
    case "grid": {
      const { body } = argsAndBody(source);
      const items = subDirectives(body, "gitem").map(({ arg, body: gb }) => ({
        service: stripQuotes(arg),
        body: gb,
      }));
      return { kind: "grid", items };
    }
    case "signals": {
      const { body } = argsAndBody(source);
      const items = subDirectives(body, "signal").map(({ arg, body: sb }) => ({
        title: stripQuotes(arg),
        body: sb,
      }));
      return { kind: "signals", items };
    }
    case "accordion": {
      const { args, body } = argsAndBody(source);
      const parts = args.split('"');
      const decisions = subDirectives(body, "decision").map(({ arg, body: db }) => ({
        title: stripQuotes(arg),
        body: db,
      }));
      return {
        kind: "accordion",
        num: (parts[0] ?? "").trim(),
        title: (parts[1] ?? "").trim(),
        subtitle: (parts[3] ?? "").trim(),
        decisions,
      };
    }
    case "tabs": {
      const { body } = argsAndBody(source);
      return { kind: "tabs", tabs: parseTabs(body) };
    }
    default:
      return { kind: "raw", name, source };
  }
}

/** Each tab is a closed `:::tab "label" … :::` block containing concept blocks. */
function parseTabs(body: string): Tab[] {
  return subDirectives(body, "tab").map(({ arg, body: tb }) => {
    const concepts = subDirectives(tb, "concept").map(({ arg: cArg, body: cb }) => {
      const sp = cArg.indexOf(" ");
      return {
        domain: sp === -1 ? "" : cArg.slice(0, sp).trim(),
        name: stripQuotes(sp === -1 ? "" : cArg.slice(sp + 1)),
        body: cb,
      };
    });
    return { label: stripQuotes(arg), concepts };
  });
}

export function serializeDirective(d: Directive): string {
  switch (d.kind) {
    case "callout":
      return `:::callout ${d.icon} "${d.title}"\n${d.body}\n:::`;
    case "aside":
      return `:::aside ${d.emoji} "${d.title}"\n${d.body}\n:::`;
    case "timeline":
      return `:::timeline\n${d.items
        .map((i) => `${i.year} ${i.title} — ${i.desc}`)
        .join("\n")}\n:::`;
    case "cards":
      return `:::cards\n${d.cards
        .map((c) => {
          const inner = [...c.tags.map((t) => `- ${t}`), c.details]
            .filter((l) => l.trim())
            .join("\n");
          return `:::card ${c.color} "${c.name}" "${c.owns}"\n${inner}\n:::`;
        })
        .join("\n")}\n:::`;
    case "grid":
      return `:::grid\n${d.items
        .map((g) => `:::gitem "${g.service}"\n${g.body}\n:::`)
        .join("\n")}\n:::`;
    case "signals":
      return `:::signals\n${d.items
        .map((s) => `:::signal "${s.title}"\n${s.body}\n:::`)
        .join("\n")}\n:::`;
    case "accordion":
      return `:::accordion ${d.num} "${d.title}" "${d.subtitle}"\n${d.decisions
        .map((dec) => `:::decision "${dec.title}"\n${dec.body}\n:::`)
        .join("\n")}\n:::`;
    case "tabs":
      return `:::tabs\n${d.tabs
        .map(
          (t) =>
            `:::tab "${t.label}"\n${t.concepts
              .map((c) => `:::concept ${c.domain} "${c.name}"\n${c.body}\n:::`)
              .join("\n")}\n:::`,
        )
        .join("\n")}\n:::`;
    case "raw":
      return d.source;
  }
}
