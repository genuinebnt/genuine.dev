//! Markdown renderer (comrak + syntect) with a directive preprocessor.
//!
//! Custom `:::directive` fences are pre-processed before the Comrak pass.
//! Each registered handler takes the fence name, an optional argument line,
//! and the inner markdown body — it returns raw HTML that is stitched back
//! into the document before the comrak + syntect pass runs on the rest.
//!
//! Directives supported (mirrors `ui_mockups.html` + `notiq_portfolio.html`):
//!   aside, callout, cards (+ card), matrix (+ mrow), accordion (+ phase),
//!   grid (+ gitem), signals (+ signal), tabs (+ tab, tab-panel), timeline (+ tl).
//!
//! Fenced code blocks are highlighted with syntect *before* the comrak pass and
//! emitted as raw `.code` HTML (filename header, copy button, per-line numbers,
//! highlighted lines) so the frontend can attach copy-button handlers.

use std::collections::HashSet;

use comrak::{Options, markdown_to_html};
use syntect::easy::HighlightLines;
use syntect::highlighting::{Theme, ThemeSet};
use syntect::parsing::SyntaxSet;
use syntect::util::LinesWithEndings;

use crate::app::ports::{Rendered, Renderer};

pub struct MarkdownRenderer {
    syntax_set: SyntaxSet,
    theme: Theme,
}

impl MarkdownRenderer {
    pub fn new() -> Self {
        let theme_set = ThemeSet::load_defaults();
        Self {
            syntax_set: SyntaxSet::load_defaults_newlines(),
            theme: theme_set.themes["base16-ocean.dark"].clone(),
        }
    }
}

impl Default for MarkdownRenderer {
    fn default() -> Self {
        Self::new()
    }
}

impl Renderer for MarkdownRenderer {
    fn render(&self, markdown: &str) -> Rendered {
        // Code fences are highlighted first (so their `filename=`/`highlight=`
        // attributes survive), then `:::` directives, then the markdown body.
        let with_code = self.preprocess_code_blocks(markdown);
        let preprocessed = preprocess_directives(&with_code);

        let mut options = Options::default();
        options.extension.table = true;
        options.extension.strikethrough = true;
        options.extension.tasklist = true;
        options.extension.footnotes = true;
        options.extension.autolink = true;
        // Slugified ids on headings so the frontend can build an anchored TOC.
        options.extension.header_id_prefix = Some(String::new());
        // Allow the raw HTML emitted by our preprocessors to pass through.
        options.render.r#unsafe = true;

        Rendered {
            html: markdown_to_html(&preprocessed, &options),
            reading_min: reading_time(markdown),
        }
    }
}

// ── Directive preprocessor ────────────────────────────────────────────────────

/// Scan the markdown for `:::name …` fences and replace them with raw HTML.
/// Everything between `:::name` and the closing `:::` is the fence body.
fn preprocess_directives(src: &str) -> String {
    let mut out = String::with_capacity(src.len());
    let mut lines = src.lines().peekable();

    while let Some(line) = lines.next() {
        if let Some(rest) = line.trim_start().strip_prefix(":::") {
            // rest = "directive-name optional args"
            let mut parts = rest.splitn(2, ' ');
            let name = parts.next().unwrap_or("").trim();
            let arg = parts.next().unwrap_or("").trim();

            // Collect everything until the *matching* closing `:::`. Container
            // directives (cards, accordion, tabs, …) nest sub-directives, so this
            // must track depth — a bare `:::` only closes the block at depth 0.
            let mut body_lines: Vec<&str> = Vec::new();
            let mut depth = 1usize;
            while let Some(&l) = lines.peek() {
                let trimmed = l.trim();
                if trimmed == ":::" {
                    lines.next();
                    depth -= 1;
                    if depth == 0 {
                        break;
                    }
                    body_lines.push(l); // keep the nested closer for sub-parsing
                } else {
                    if trimmed.starts_with(":::") {
                        depth += 1;
                    }
                    body_lines.push(lines.next().unwrap());
                }
            }
            let body = body_lines.join("\n");

            let html = render_directive(name, arg, &body);
            out.push_str(&html);
            out.push('\n');
        } else {
            out.push_str(line);
            out.push('\n');
        }
    }
    out
}

fn render_directive(name: &str, arg: &str, body: &str) -> String {
    match name {
        "aside" => render_aside(arg, body),
        "callout" => render_callout(arg, body),
        "cards" => render_cards(body),
        "matrix" => render_matrix(body),
        "accordion" => render_accordion(arg, body),
        "grid" => render_grid(body),
        "signals" => render_signals(body),
        "tabs" => render_tabs(arg, body),
        "timeline" => render_timeline(body),
        _ => {
            // Unknown directive — pass through as a blockquote so nothing is lost.
            format!("<blockquote><p><strong>{name}</strong>: {body}</p></blockquote>")
        }
    }
}

/// `:::aside 🦀 "Ferris' hot tip"`
/// Renders the character aside used for personality callouts.
fn render_aside(arg: &str, body: &str) -> String {
    // arg = `🦀 "Title"` — split on first space
    let (emoji, title) = arg.split_once(' ').unwrap_or(("🦀", "Ferris' hot tip"));
    let title = title.trim_matches('"');
    let escaped_body = escape_html(body);
    format!(
        r#"<div class="aside"><div class="avatar">{emoji}</div><div><div class="who">{title}</div><div class="say">{escaped_body}</div></div></div>"#
    )
}

/// `:::callout ⚠ "Gotcha"` or `:::callout ℹ Note`
fn render_callout(arg: &str, body: &str) -> String {
    let (icon, title) = arg.split_once(' ').unwrap_or(("ℹ", arg));
    let title = title.trim_matches('"');
    let escaped_body = escape_html(body);
    format!(
        r#"<div class="callout"><div class="ctitle">{icon} {title}</div><p>{escaped_body}</p></div>"#
    )
}

/// `:::cards` — service / bounded-context card grid.
/// Inner body may contain `:::card color "Name" "Owns" "tags..."` sub-directives.
fn render_cards(body: &str) -> String {
    let inner = preprocess_sub_directives(body, "card", render_card_item);
    format!(r#"<div class="service-grid">{inner}</div>"#)
}

fn render_card_item(arg: &str, body: &str) -> String {
    // arg = `color "Name" "Owns"`
    let mut parts = arg.splitn(3, '"');
    let color = parts.next().unwrap_or("").trim();
    let name = parts.next().unwrap_or("").trim();
    let _ = parts.next(); // closing quote separator
    let owns = {
        // Anything after the second quoted section is owns
        let mut p2 = arg.splitn(5, '"');
        p2.nth(3).unwrap_or("").trim().to_owned()
    };
    // Tags from body: one per line starting with `-`
    let tags: String = body
        .lines()
        .filter(|l| l.trim_start().starts_with('-'))
        .map(|l| {
            format!(
                r#"<span class="svc-tag">{}</span>"#,
                l.trim_start_matches([' ', '-']).trim()
            )
        })
        .collect();
    // Details: remaining non-tag lines
    let details = escape_html(
        &body
            .lines()
            .filter(|l| !l.trim_start().starts_with('-') && !l.trim().is_empty())
            .collect::<Vec<_>>()
            .join(" "),
    );
    format!(
        r#"<div class="svc-card {color}"><div class="svc-name">{name}</div><div class="svc-owns">{owns}</div><div class="svc-tags">{tags}</div><div class="svc-details">{details}</div></div>"#
    )
}

/// `:::matrix` — communication matrix. Body is a markdown table.
fn render_matrix(body: &str) -> String {
    // The body must be rendered to an HTML `<table>` here: the outer `<div>` makes
    // this a raw HTML block in the main pass, which comrak would otherwise leave
    // un-parsed (the table markdown would render as literal text).
    let mut options = Options::default();
    options.extension.table = true;
    let table_html = markdown_to_html(body, &options);
    format!(r#"<div class="comm-matrix-wrap">{table_html}</div>"#)
}

/// `:::accordion 1 "Phase title" "subtitle"`
fn render_accordion(arg: &str, body: &str) -> String {
    // arg = `1 "Phase title" "subtitle"`
    let mut parts = arg.splitn(4, '"');
    let num_raw = parts.next().unwrap_or("").trim();
    let title = parts.next().unwrap_or("Phase").trim();
    let _ = parts.next();
    let subtitle = parts.next().unwrap_or("").trim().trim_matches('"');
    let num: u32 = num_raw.parse().unwrap_or(0);

    let inner = preprocess_sub_directives(body, "decision", render_decision_item);
    // Interactivity (toggling `.open`) is attached client-side by `DocInteractive`.
    format!(
        r#"<div class="phase"><div class="phase-header"><div class="phase-num">{num:02}</div><div><div class="phase-title">{title}</div><div class="phase-sub">{subtitle}</div></div></div><div class="phase-body"><div class="decision-grid">{inner}</div></div></div>"#
    )
}

fn render_decision_item(arg: &str, body: &str) -> String {
    let escaped_body = escape_html(body);
    format!(
        r#"<div class="decision"><div class="decision-title">{arg}</div><p>{escaped_body}</p></div>"#
    )
}

/// `:::grid` — infra / coverage grid.
fn render_grid(body: &str) -> String {
    let inner = preprocess_sub_directives(body, "gitem", render_grid_item);
    format!(r#"<div class="coverage-grid">{inner}</div>"#)
}

fn render_grid_item(arg: &str, body: &str) -> String {
    let escaped_body = escape_html(body);
    format!(
        r#"<div class="cov-item"><div class="cov-service">{arg}</div><div class="cov-impl">{escaped_body}</div></div>"#
    )
}

/// `:::signals` — design-decision signals grid.
fn render_signals(body: &str) -> String {
    let inner = preprocess_sub_directives(body, "signal", render_signal_item);
    format!(r#"<div class="decision-grid">{inner}</div>"#)
}

fn render_signal_item(arg: &str, body: &str) -> String {
    render_decision_item(arg, body)
}

/// `:::tabs` — engineering-depth tabs with concept-card panels.
/// Inner body: `:::tab "Label" … :::` blocks, each containing concept cards.
fn render_tabs(_default_tab: &str, body: &str) -> String {
    let mut buttons = String::new();
    let mut panels = String::new();

    // Tab switching is wired client-side by `DocInteractive` (index-based), so the
    // buttons carry no inline handler.
    for (i, (label_arg, tab_body)) in collect_blocks(body, "tab").iter().enumerate() {
        let label = label_arg.trim().trim_matches('"');
        let id = slug_id(label);
        let active = if i == 0 { " active" } else { "" };
        buttons.push_str(&format!(r#"<button class="tab{active}">{label}</button>"#));
        let cards = preprocess_sub_directives(tab_body, "concept", render_concept_card);
        panels.push_str(&format!(
            r#"<div class="tab-panel{active}" id="tab-{id}"><div class="concept-grid">{cards}</div></div>"#
        ));
    }

    format!(r#"<div class="tabs-wrap"><div class="tabs">{buttons}</div>{panels}</div>"#)
}

fn render_concept_card(arg: &str, body: &str) -> String {
    // arg = `domain "Card name"`
    let mut parts = arg.splitn(3, '"');
    let domain = parts.next().unwrap_or("").trim();
    let card_name = parts.next().unwrap_or(arg).trim();
    let escaped_body = escape_html(body);
    format!(
        r#"<div class="concept-card"><span class="concept-domain {domain}">{domain}</span><div class="concept-name">{card_name}</div><div class="concept-desc">{escaped_body}</div></div>"#
    )
}

/// `:::timeline` — chronological entries.
/// Each line: `YEAR Title — description`
fn render_timeline(body: &str) -> String {
    let mut items = String::new();
    for line in body.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        // Format: `2026 genuine.dev — built this site`
        let (year, rest) = line.split_once(' ').unwrap_or(("", line));
        let (title, desc) = rest.split_once(" — ").unwrap_or((rest, ""));
        items.push_str(&format!(
            r#"<div class="tl"><div class="ty">{year}</div><div class="tt"><b>{title}</b> <span>— {desc}</span></div></div>"#
        ));
    }
    format!(
        r#"<div class="section-label">timeline</div><div class="timeline">{items}</div>"#
    )
}

// ── Sub-directive helper ──────────────────────────────────────────────────────

/// Render each `:::name arg … :::` sub-block found in `src` via `render_fn`.
fn preprocess_sub_directives<F>(src: &str, name: &str, render_fn: F) -> String
where
    F: Fn(&str, &str) -> String,
{
    collect_blocks(src, name)
        .iter()
        .map(|(arg, body)| render_fn(arg, body))
        .collect()
}

/// Collect every top-level `:::name arg … :::` block in `src` as `(arg, body)`.
/// Depth-aware, so a block's body may itself contain nested directives.
fn collect_blocks(src: &str, name: &str) -> Vec<(String, String)> {
    let open_bare = format!(":::{name}");
    let open_prefixed = format!(":::{name} ");
    let mut out = Vec::new();
    let mut lines = src.lines().peekable();

    while let Some(line) = lines.next() {
        let trimmed = line.trim_start();
        if trimmed != open_bare && !trimmed.starts_with(&open_prefixed) {
            continue;
        }
        let arg = trimmed[open_bare.len()..].trim().to_owned();

        let mut body_lines: Vec<&str> = Vec::new();
        let mut depth = 1usize;
        while let Some(&l) = lines.peek() {
            let lt = l.trim();
            if lt == ":::" {
                lines.next();
                depth -= 1;
                if depth == 0 {
                    break;
                }
                body_lines.push(l);
            } else {
                if lt.starts_with(":::") {
                    depth += 1;
                }
                body_lines.push(lines.next().unwrap());
            }
        }
        out.push((arg, body_lines.join("\n")));
    }
    out
}

// ── Fenced code blocks (syntect) ──────────────────────────────────────────────

impl MarkdownRenderer {
    /// Replace ```` ```lang filename="…" highlight="…" ```` fences with the themed
    /// `.code` layout, syntax-highlighted line by line via syntect.
    fn preprocess_code_blocks(&self, src: &str) -> String {
        let mut out = String::with_capacity(src.len());
        let mut lines = src.lines();

        while let Some(line) = lines.next() {
            let Some(info) = line.trim_start().strip_prefix("```") else {
                out.push_str(line);
                out.push('\n');
                continue;
            };

            let mut body: Vec<&str> = Vec::new();
            for l in lines.by_ref() {
                if l.trim_start().starts_with("```") {
                    break;
                }
                body.push(l);
            }
            out.push_str(&self.render_code_block(info.trim(), &body.join("\n")));
            out.push('\n');
        }
        out
    }

    fn render_code_block(&self, info: &str, code: &str) -> String {
        let CodeFence {
            language,
            filename,
            highlight,
        } = parse_code_fence(info);

        let syntax = self
            .syntax_set
            .find_syntax_by_token(&language)
            .unwrap_or_else(|| self.syntax_set.find_syntax_plain_text());
        let mut highlighter = HighlightLines::new(syntax, &self.theme);

        let mut pre = String::new();
        for (i, raw_line) in LinesWithEndings::from(code).enumerate() {
            let line_no = i + 1;
            let mut line_html = format!(r#"<span class="ln">{line_no}</span>"#);

            let regions = highlighter
                .highlight_line(raw_line, &self.syntax_set)
                .unwrap_or_default();
            for (style, text) in regions {
                let color = style.foreground;
                line_html.push_str(&format!(
                    r#"<span style="color:#{:02x}{:02x}{:02x}">{}</span>"#,
                    color.r,
                    color.g,
                    color.b,
                    escape_html(text.trim_end_matches('\n')),
                ));
            }

            if highlight.contains(&line_no) {
                pre.push_str(&format!(r#"<span class="hl">{line_html}</span>"#));
            } else {
                pre.push_str(&line_html);
            }
            pre.push('\n');
        }
        let pre = pre.trim_end_matches('\n');

        let label = filename.unwrap_or(language);
        // Raw source lives in `data-copy` so the copy button never grabs line numbers.
        format!(
            r#"<div class="code"><div class="chead"><span class="cfile">{label}</span><button class="ccopy" data-copy="{copy}">copy</button></div><pre>{pre}</pre></div>"#,
            label = escape_html(&label),
            copy = escape_html(code),
        )
    }
}

struct CodeFence {
    language: String,
    filename: Option<String>,
    highlight: HashSet<usize>,
}

/// Parse a fence info string: `rust filename="queue.rs" highlight="1,3-5"`.
fn parse_code_fence(info: &str) -> CodeFence {
    let language = info
        .split_whitespace()
        .next()
        .filter(|t| !t.contains('='))
        .unwrap_or("")
        .to_owned();

    CodeFence {
        language,
        filename: fence_attr(info, "filename"),
        highlight: fence_attr(info, "highlight")
            .map(|h| parse_line_ranges(&h))
            .unwrap_or_default(),
    }
}

/// Pull a `key="value"` attribute out of a fence info string.
fn fence_attr(info: &str, key: &str) -> Option<String> {
    let start = info.find(&format!("{key}=\""))? + key.len() + 2;
    let len = info[start..].find('"')?;
    Some(info[start..start + len].to_owned())
}

/// `"1,3-5"` → {1, 3, 4, 5}.
fn parse_line_ranges(spec: &str) -> HashSet<usize> {
    let mut lines = HashSet::new();
    for part in spec.split(',') {
        let part = part.trim();
        match part.split_once('-') {
            Some((a, b)) => {
                if let (Ok(a), Ok(b)) = (a.trim().parse(), b.trim().parse::<usize>()) {
                    lines.extend(a..=b);
                }
            }
            None => {
                if let Ok(n) = part.parse() {
                    lines.insert(n);
                }
            }
        }
    }
    lines
}

// ── Utilities ─────────────────────────────────────────────────────────────────

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn slug_id(s: &str) -> String {
    s.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .trim_matches('-')
        .to_owned()
}

/// ~200 words per minute, minimum 1.
fn reading_time(markdown: &str) -> i32 {
    let words = markdown.split_whitespace().count();
    ((words as f64 / 200.0).ceil() as i32).max(1)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn highlights_fenced_code() {
        let out = MarkdownRenderer::new().render("```rust\nlet x = 1;\n```");
        // syntect emits inline-styled spans; our wrapper adds `.code` chrome.
        assert!(out.html.contains("class=\"code\""));
        assert!(out.html.contains("class=\"ccopy\""));
        assert!(out.html.contains("class=\"ln\""));
    }

    #[test]
    fn code_fence_attrs_set_filename_and_highlight() {
        let md = "```rust filename=\"queue.rs\" highlight=\"2\"\nlet a = 1;\nlet b = 2;\n```";
        let out = MarkdownRenderer::new().render(md);
        assert!(out.html.contains(r#"<span class="cfile">queue.rs</span>"#));
        // Only the second line is wrapped for highlight.
        assert_eq!(out.html.matches("class=\"hl\"").count(), 1);
        // The copy payload carries the raw source, not the line-numbered markup.
        assert!(out.html.contains(
            r#"data-copy="let a = 1;
let b = 2;""#
        ));
    }

    #[test]
    fn parse_line_ranges_expands_spans() {
        let lines = parse_line_ranges("1,3-5");
        assert_eq!(lines, HashSet::from([1, 3, 4, 5]));
    }

    #[test]
    fn reading_time_is_at_least_one() {
        assert_eq!(
            MarkdownRenderer::new().render("one two three").reading_min,
            1
        );
    }

    #[test]
    fn aside_directive_renders_character_aside() {
        let md = ":::aside 🦀 \"Ferris' hot tip\"\nwatch your pointers!\n:::";
        let out = MarkdownRenderer::new().render(md);
        assert!(out.html.contains("class=\"aside\""));
        assert!(out.html.contains("Ferris' hot tip"));
        assert!(out.html.contains("🦀"));
    }

    #[test]
    fn callout_directive_renders_callout() {
        let md = ":::callout ⚠ Gotcha\nPointers are tricky.\n:::";
        let out = MarkdownRenderer::new().render(md);
        assert!(out.html.contains("class=\"callout\""));
        assert!(out.html.contains("Gotcha"));
    }

    #[test]
    fn nested_container_directive_renders_all_children() {
        // The depth-aware preprocessor must capture every nested sub-directive,
        // not stop at the first inner `:::`.
        let md = ":::cards\n\
             :::card gateway \"one\" \"owns: a\"\n- t1\nfirst card body.\n:::\n\
             :::card queue \"two\" \"owns: b\"\n- t2\nsecond card body.\n:::\n\
             :::";
        let out = MarkdownRenderer::new().render(md);
        assert_eq!(out.html.matches("svc-card").count(), 2);
        assert!(out.html.contains("one"));
        assert!(out.html.contains("two"));
        // No stray directive markers leak into the output.
        assert!(!out.html.contains(":::"));
    }

    #[test]
    fn matrix_directive_renders_markdown_table() {
        let md = ":::matrix\n| From | To |\n|---|---|\n| a | b |\n:::";
        let out = MarkdownRenderer::new().render(md);
        assert!(out.html.contains("comm-matrix-wrap"));
        assert!(out.html.contains("<table>"));
        assert!(out.html.contains("<td>a</td>"));
        // The raw pipe syntax must not leak through as literal text.
        assert!(!out.html.contains("| a | b |"));
    }

    #[test]
    fn timeline_directive_renders_entries() {
        let md =
            ":::timeline\n2026 genuine.dev — built this site\n2025 NotiQ — Rust platform\n:::";
        let out = MarkdownRenderer::new().render(md);
        assert!(out.html.contains("class=\"section-label\">timeline</div>"));
        assert!(out.html.contains("class=\"timeline\""));
        assert!(out.html.contains("genuine.dev"));
        assert!(out.html.contains("NotiQ"));
    }
}
