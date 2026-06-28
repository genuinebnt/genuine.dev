set dotenv-load := true

# start local Postgres
db-up:
    docker compose up -d

# stop local Postgres
db-down:
    docker compose down

# run the dev server (hot reload)
dev:
    cargo leptos watch

# full build (server + wasm)
build:
    cargo leptos build

# apply migrations
migrate:
    sqlx migrate run

# format, lint, test (server build)
check:
    cargo fmt --all -- --check
    cargo clippy --no-default-features --features ssr -- -D warnings
    cargo test --no-default-features --features ssr
