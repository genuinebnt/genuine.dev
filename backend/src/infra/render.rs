//! Markdown renderer (comrak + syntect highlighting). Implements `Renderer`.

use comrak::options::Plugins;
use comrak::plugins::syntect::SyntectAdapter;
use comrak::{Options, markdown_to_html_with_plugins};

use crate::app::ports::{Rendered, Renderer};

pub struct MarkdownRenderer {
    adapter: SyntectAdapter,
}

impl MarkdownRenderer {
    pub fn new() -> Self {
        Self {
            adapter: SyntectAdapter::new(Some("base16-ocean.dark")),
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
        let mut options = Options::default();
        options.extension.table = true;
        options.extension.strikethrough = true;
        options.extension.tasklist = true;
        options.extension.footnotes = true;
        options.extension.autolink = true;

        let mut plugins = Plugins::default();
        plugins.render.codefence_syntax_highlighter = Some(&self.adapter);

        Rendered {
            html: markdown_to_html_with_plugins(markdown, &options, &plugins),
            reading_min: reading_time(markdown),
        }
    }
}

/// ~200 words per minute, minimum 1.
fn reading_time(markdown: &str) -> i32 {
    let words = markdown.split_whitespace().count();
    ((words as f64 / 200.0).ceil() as i32).max(1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn highlights_fenced_code() {
        let out = MarkdownRenderer::new().render("```rust\nlet x = 1;\n```");
        // syntect emits inline-styled spans for highlighted code.
        assert!(out.html.contains("<span"));
        assert!(out.html.contains("style"));
    }

    #[test]
    fn reading_time_is_at_least_one() {
        assert_eq!(
            MarkdownRenderer::new().render("one two three").reading_min,
            1
        );
    }
}
