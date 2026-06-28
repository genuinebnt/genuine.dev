//! Tracing / telemetry initialization.

use tracing_subscriber::{EnvFilter, fmt};

/// Installs the global tracing subscriber. `RUST_LOG` overrides the default filter.
pub fn init() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,genuine_dev=debug"));
    fmt().with_env_filter(filter).init();
}
