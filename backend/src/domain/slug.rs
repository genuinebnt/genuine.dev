use thiserror::Error;

/// A URL slug: lowercase ASCII alphanumerics and hyphens. Validated on construction.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Slug(String);

#[derive(Debug, Error, PartialEq, Eq)]
pub enum SlugError {
    #[error("slug is empty")]
    Empty,
    #[error("slug contains invalid characters")]
    InvalidChars,
}

impl Slug {
    /// Validate an existing slug string.
    pub fn parse(input: &str) -> Result<Self, SlugError> {
        let s = input.trim();
        if s.is_empty() {
            return Err(SlugError::Empty);
        }
        let valid = s
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
        if !valid {
            return Err(SlugError::InvalidChars);
        }
        Ok(Self(s.to_owned()))
    }

    /// Derive a slug from a human title (lowercase, non-alphanumerics → hyphens).
    pub fn from_title(title: &str) -> Result<Self, SlugError> {
        let mut out = String::with_capacity(title.len());
        let mut prev_dash = false;
        for c in title.chars() {
            if c.is_ascii_alphanumeric() {
                out.push(c.to_ascii_lowercase());
                prev_dash = false;
            } else if !prev_dash {
                out.push('-');
                prev_dash = true;
            }
        }
        Self::parse(out.trim_matches('-'))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for Slug {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_empty() {
        assert_eq!(Slug::parse("   "), Err(SlugError::Empty));
    }

    #[test]
    fn parse_rejects_uppercase_and_spaces() {
        assert_eq!(Slug::parse("Hello World"), Err(SlugError::InvalidChars));
    }

    #[test]
    fn from_title_slugifies_punctuation_and_case() {
        assert_eq!(
            Slug::from_title("Hello, World!  (v2)").unwrap().as_str(),
            "hello-world-v2"
        );
    }

    #[test]
    fn from_title_trims_edge_hyphens() {
        assert_eq!(Slug::from_title("  --Rust!--  ").unwrap().as_str(), "rust");
    }
}
