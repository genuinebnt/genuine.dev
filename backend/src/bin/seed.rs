//! Dev CLI: insert or refresh seed documents.

use std::env;

#[tokio::main]
async fn main() {
    genuine_dev::telemetry::init();
    #[cfg(debug_assertions)]
    let _ = dotenvy::dotenv_override();
    #[cfg(not(debug_assertions))]
    let _ = dotenvy::dotenv();

    let refresh = env::args().any(|a| a == "--refresh");

    let config = match genuine_dev::config::Config::from_env() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("config error: {e}");
            std::process::exit(1);
        }
    };

    let pool = match genuine_dev::infra::db::connect(&config.database_url).await {
        Ok(p) => p,
        Err(e) => {
            eprintln!("database error: {e}");
            std::process::exit(1);
        }
    };

    if let Err(e) = genuine_dev::infra::db::migrate(&pool).await {
        eprintln!("migrate error: {e}");
        std::process::exit(1);
    }

    if refresh {
        if let Err(e) = genuine_dev::infra::seed::seed_refresh(&pool).await {
            eprintln!("seed_refresh error: {e}");
            std::process::exit(1);
        }
    } else {
        if let Err(e) = genuine_dev::infra::seed::seed_if_empty(&pool).await {
            eprintln!("seed_if_empty error: {e}");
            std::process::exit(1);
        }
        if let Err(e) = genuine_dev::infra::seed::seed_missing(&pool).await {
            eprintln!("seed_missing error: {e}");
            std::process::exit(1);
        }
    }

    tracing::info!("seed complete");
}
