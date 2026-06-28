# ---- builder ----
FROM rust:1-bookworm AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

# ---- runtime ----
FROM debian:bookworm-slim AS runtime
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -m -u 10001 app
WORKDIR /app
COPY --from=builder /app/target/release/genuine-folio ./genuine-folio
ENV BIND_ADDR=0.0.0.0:3001 \
    RUST_LOG=info
USER app
EXPOSE 3001
CMD ["./genuine-folio"]
