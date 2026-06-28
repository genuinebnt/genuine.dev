#!/usr/bin/env bash
# Nightly Postgres backup. Run from the deploy directory (cron-friendly).
set -euo pipefail

ts=$(date +%Y%m%d-%H%M%S)
out="backup-${ts}.sql.gz"

docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U folio folio | gzip >"${out}"

echo "wrote ${out}"
# TODO: upload offsite (Backblaze B2 / Hetzner Storage Box / S3) and prune old local copies.
