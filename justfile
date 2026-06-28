# genuine.dev — dev task runner
# Requires: just, docker, cargo, node/npm, sqlx-cli
# First time: copy .env.example → .env and fill in secrets.

set dotenv-load := true

DB_URL := env_var_or_default("DATABASE_URL", "postgres://folio:folio@localhost:5432/folio")

# ── quick start ───────────────────────────────────────────────────────────────

# Start everything: Postgres + backend + frontend
dev: db-up migrate seed
    #!/usr/bin/env bash
    set -e
    trap 'kill 0' EXIT
    echo "▶ backend  → http://localhost:3001"
    echo "▶ frontend → http://localhost:3000"
    (cd backend && cargo run --bin genuine-dev) &
    (cd frontend && npm run dev) &
    wait

# ── individual services ───────────────────────────────────────────────────────

# Start Postgres in Docker (detached)
db-up:
    docker compose up -d
    @echo "Waiting for Postgres…"
    @until docker compose exec postgres pg_isready -U folio -d folio -q 2>/dev/null; do sleep 1; done
    @echo "Postgres ready."

# Stop Postgres
db-down:
    docker compose down

# Apply all pending migrations
migrate:
    sqlx migrate run --source backend/migrations --database-url "{{DB_URL}}"

# Run backend only (cargo watch for auto-reload if installed)
backend:
    cd backend && cargo run --bin genuine-dev

# Run frontend only (Next.js dev server)
frontend:
    cd frontend && npm run dev

# Clear stale Next.js build cache (fixes HMR manifest / 500 errors)
frontend-clean:
    cd frontend && npm run clean

# ── quality ───────────────────────────────────────────────────────────────────

# Format + clippy + test (backend)
check:
    cargo fmt --manifest-path backend/Cargo.toml --all -- --check
    cargo clippy --manifest-path backend/Cargo.toml -- -D warnings
    cargo test --manifest-path backend/Cargo.toml

# Next.js production build check
build-frontend:
    cd frontend && npm run build

# ESLint (Next.js app router rules)
lint-frontend:
    cd frontend && npm run lint

# ── setup (first time) ────────────────────────────────────────────────────────

# Install all dependencies (sqlx-cli + npm packages)
setup:
    cargo install sqlx-cli --no-default-features --features postgres
    cd frontend && npm install

# Insert missing seed documents (skips slugs already in the DB)
seed:
    cd backend && cargo run --bin seed

# Re-render and upsert all seed documents (after editing seed content)
seed-refresh:
    cd backend && cargo run --bin seed -- --refresh
