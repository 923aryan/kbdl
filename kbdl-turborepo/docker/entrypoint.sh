#!/bin/sh
set -e

CMD_NAME="${1:-start}"

echo "▶ Waiting for Postgres..."
ATTEMPTS=0
MAX_ATTEMPTS=60
PGHOST="${PGHOST:-postgres}"
PGUSER="${PGUSER:-kbdl}"
PGDATABASE="${PGDATABASE:-kbdl}"
until pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "❌ Postgres not ready after ${MAX_ATTEMPTS}s"
    exit 1
  fi
  sleep 1
done
echo "✅ Postgres is ready"

DB_DIR="/app/packages/db"

prisma_cmd() {
  cd "$DB_DIR"
  if [ -f ./scripts/prisma-cli.mjs ]; then
    node ./scripts/prisma-cli.mjs "$@"
  else
    pnpm exec prisma "$@"
  fi
}

# Idempotent schema sync — safe after db push reset (no migration history required)
apply_schema_sync() {
  echo "▶ Syncing Prisma schema (db push)..."
  prisma_cmd db push
}

apply_migrations() {
  echo "▶ Applying Prisma migrations (migrate deploy)..."
  prisma_cmd migrate deploy
}

apply_force_reset() {
  echo "▶ Resetting database schema (db push --force-reset)..."
  prisma_cmd db push --force-reset --accept-data-loss
}

baseline_migrations() {
  if [ -f "$DB_DIR/scripts/baseline-migrations.sh" ]; then
    sh "$DB_DIR/scripts/baseline-migrations.sh"
  else
    echo "▶ Baselining migration history..."
    cd "$DB_DIR"
    for migration_dir in prisma/migrations/*/; do
      [ -d "$migration_dir" ] || continue
      migration_name=$(basename "$migration_dir")
      prisma_cmd migrate resolve --applied "$migration_name" || true
    done
  fi
}

run_seed() {
  echo "▶ Seeding database..."
  cd "$DB_DIR"
  node ./prisma/seed.mjs
}

# PRISMA_APPLY_MODE=push (default, Docker dev) | migrate (production with history)
APPLY_MODE="${PRISMA_APPLY_MODE:-push}"

apply_schema_on_start() {
  if [ "$APPLY_MODE" = "migrate" ]; then
    apply_migrations
  else
    apply_schema_sync
  fi
}

case "$CMD_NAME" in
  start)
    apply_schema_on_start
    if [ "$SEED_ON_START" = "true" ]; then
      run_seed
    fi
    echo "▶ Starting backend on port ${PORT:-8000}..."
    cd /app/apps/kbdl-backend
    exec node dist/server.js
    ;;
  seed)
    apply_schema_sync
    run_seed
    ;;
  reset-seed)
    apply_force_reset
    run_seed
    baseline_migrations
    ;;
  migrate)
    apply_migrations
    ;;
  baseline)
    baseline_migrations
    ;;
  *)
    exec "$@"
    ;;
esac
