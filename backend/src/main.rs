#[tokio::main]
async fn main() {
    genuine_dev::telemetry::init();
    if let Err(err) = genuine_dev::server::run().await {
        tracing::error!("fatal: {err}");
        std::process::exit(1);
    }
}
