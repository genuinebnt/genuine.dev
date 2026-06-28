"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { useMemo } from "react";
import {
  parseDirective,
  serializeDirective,
  type Directive,
} from "../../lib/directives";

/**
 * React NodeView for `:::` directive blocks. Renders a structured form for the
 * families with a dedicated editor, and a raw-source textarea for the rest.
 * Every edit re-serializes to directive markdown stored on the node.
 */
export function DirectiveView({ node, updateAttributes }: any) {
  const name: string = node.attrs.name || "block";
  const source: string = node.attrs.source || "";
  const model = useMemo(() => parseDirective(name, source), [name, source]);

  const commit = (next: Directive) =>
    updateAttributes({ source: serializeDirective(next), name });

  return (
    <NodeViewWrapper className="tt-dir" data-name={name}>
      <div className="tt-dir-head">
        <span className="tt-dir-badge">{name}</span>
      </div>
      <div className="tt-dir-body">
        <DirectiveForm model={model} commit={commit} rawSource={source} onRaw={(s) => updateAttributes({ source: s, name })} />
      </div>
    </NodeViewWrapper>
  );
}

function DirectiveForm({
  model,
  commit,
  rawSource,
  onRaw,
}: {
  model: Directive;
  commit: (d: Directive) => void;
  rawSource: string;
  onRaw: (s: string) => void;
}) {
  switch (model.kind) {
    case "callout":
    case "aside": {
      const iconKey = model.kind === "callout" ? "icon" : "emoji";
      const icon = model.kind === "callout" ? model.icon : model.emoji;
      return (
        <>
          <div className="tt-row">
            <Field label={model.kind === "callout" ? "Icon" : "Emoji"} width="64px">
              <input value={icon} onChange={(e) => commit({ ...model, [iconKey]: e.target.value } as Directive)} />
            </Field>
            <Field label="Title" grow>
              <input value={model.title} onChange={(e) => commit({ ...model, title: e.target.value })} />
            </Field>
          </div>
          <Field label="Body (markdown)">
            <textarea rows={3} value={model.body} onChange={(e) => commit({ ...model, body: e.target.value })} />
          </Field>
        </>
      );
    }
    case "timeline":
      return (
        <ListEditor
          items={model.items}
          blank={{ year: "", title: "", desc: "" }}
          onChange={(items) => commit({ ...model, items })}
          render={(item, set) => (
            <div className="tt-row">
              <Field label="Year" width="72px">
                <input value={item.year} onChange={(e) => set({ ...item, year: e.target.value })} />
              </Field>
              <Field label="Title" grow>
                <input value={item.title} onChange={(e) => set({ ...item, title: e.target.value })} />
              </Field>
              <Field label="Description" grow>
                <input value={item.desc} onChange={(e) => set({ ...item, desc: e.target.value })} />
              </Field>
            </div>
          )}
        />
      );
    case "cards":
      return (
        <ListEditor
          items={model.cards}
          blank={{ color: "gateway", name: "", owns: "", tags: [], details: "" }}
          onChange={(cards) => commit({ ...model, cards })}
          render={(card, set) => (
            <>
              <div className="tt-row">
                <Field label="Color" width="120px">
                  <input value={card.color} onChange={(e) => set({ ...card, color: e.target.value })} />
                </Field>
                <Field label="Name" grow>
                  <input value={card.name} onChange={(e) => set({ ...card, name: e.target.value })} />
                </Field>
              </div>
              <Field label="Owns">
                <input value={card.owns} onChange={(e) => set({ ...card, owns: e.target.value })} />
              </Field>
              <Field label="Tags (comma-separated)">
                <input
                  value={card.tags.join(", ")}
                  onChange={(e) => set({ ...card, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                />
              </Field>
              <Field label="Details">
                <textarea rows={2} value={card.details} onChange={(e) => set({ ...card, details: e.target.value })} />
              </Field>
            </>
          )}
        />
      );
    case "grid":
      return (
        <ListEditor
          items={model.items}
          blank={{ service: "", body: "" }}
          onChange={(items) => commit({ ...model, items })}
          render={(item, set) => (
            <>
              <Field label="Service">
                <input value={item.service} onChange={(e) => set({ ...item, service: e.target.value })} />
              </Field>
              <Field label="Body">
                <textarea rows={2} value={item.body} onChange={(e) => set({ ...item, body: e.target.value })} />
              </Field>
            </>
          )}
        />
      );
    case "signals":
      return (
        <ListEditor
          items={model.items}
          blank={{ title: "", body: "" }}
          onChange={(items) => commit({ ...model, items })}
          render={(item, set) => (
            <>
              <Field label="Title">
                <input value={item.title} onChange={(e) => set({ ...item, title: e.target.value })} />
              </Field>
              <Field label="Body">
                <textarea rows={2} value={item.body} onChange={(e) => set({ ...item, body: e.target.value })} />
              </Field>
            </>
          )}
        />
      );
    case "accordion":
      return (
        <>
          <div className="tt-row">
            <Field label="No." width="56px">
              <input value={model.num} onChange={(e) => commit({ ...model, num: e.target.value })} />
            </Field>
            <Field label="Title" grow>
              <input value={model.title} onChange={(e) => commit({ ...model, title: e.target.value })} />
            </Field>
            <Field label="Subtitle" grow>
              <input value={model.subtitle} onChange={(e) => commit({ ...model, subtitle: e.target.value })} />
            </Field>
          </div>
          <ListEditor
            items={model.decisions}
            blank={{ title: "", body: "" }}
            onChange={(decisions) => commit({ ...model, decisions })}
            render={(dec, set) => (
              <>
                <Field label="Decision">
                  <input value={dec.title} onChange={(e) => set({ ...dec, title: e.target.value })} />
                </Field>
                <Field label="Body">
                  <textarea rows={2} value={dec.body} onChange={(e) => set({ ...dec, body: e.target.value })} />
                </Field>
              </>
            )}
          />
        </>
      );
    case "tabs":
      return (
        <ListEditor
          items={model.tabs}
          blank={{ label: "", concepts: [] }}
          onChange={(tabs) => commit({ ...model, tabs })}
          render={(tab, setTab) => (
            <>
              <Field label="Tab label">
                <input value={tab.label} onChange={(e) => setTab({ ...tab, label: e.target.value })} />
              </Field>
              <ListEditor
                items={tab.concepts}
                blank={{ domain: "micro", name: "", body: "" }}
                onChange={(concepts) => setTab({ ...tab, concepts })}
                render={(c, set) => (
                  <>
                    <div className="tt-row">
                      <Field label="Domain" width="110px">
                        <input value={c.domain} onChange={(e) => set({ ...c, domain: e.target.value })} />
                      </Field>
                      <Field label="Name" grow>
                        <input value={c.name} onChange={(e) => set({ ...c, name: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="Body">
                      <textarea rows={2} value={c.body} onChange={(e) => set({ ...c, body: e.target.value })} />
                    </Field>
                  </>
                )}
              />
            </>
          )}
        />
      );
    case "raw":
      return (
        <Field label="Source (advanced)">
          <textarea
            className="tt-mono"
            rows={Math.min(16, rawSource.split("\n").length + 1)}
            value={rawSource}
            spellCheck={false}
            onChange={(e) => onRaw(e.target.value)}
          />
        </Field>
      );
  }
}

function Field({
  label,
  children,
  grow,
  width,
}: {
  label: string;
  children: React.ReactNode;
  grow?: boolean;
  width?: string;
}) {
  return (
    <label className="tt-field" style={{ flex: grow ? 1 : undefined, width }}>
      <span className="tt-field-label">{label}</span>
      {children}
    </label>
  );
}

/** Generic add/remove list editor used by the multi-item directive families. */
function ListEditor<T>({
  items,
  blank,
  onChange,
  render,
}: {
  items: T[];
  blank: T;
  onChange: (items: T[]) => void;
  render: (item: T, set: (next: T) => void) => React.ReactNode;
}) {
  const setAt = (idx: number, next: T) =>
    onChange(items.map((it, i) => (i === idx ? next : it)));
  return (
    <div className="tt-list">
      {items.map((item, idx) => (
        <div className="tt-list-item" key={idx}>
          <div className="tt-list-fields">{render(item, (next) => setAt(idx, next))}</div>
          <button
            type="button"
            className="tt-list-remove"
            title="Remove"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="tt-list-add" onClick={() => onChange([...items, structuredClone(blank)])}>
        + Add
      </button>
    </div>
  );
}
