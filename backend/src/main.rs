mod api;
mod app;
mod config;
mod domain;
mod error;
mod infra;
mod server;
mod telemetry;

#[tokio::main]
async fn main() {
    telemetry::init();
    if let Err(err) = server::run().await {
        tracing::error!("fatal: {err}");
        std::process::exit(1);
    }
}
