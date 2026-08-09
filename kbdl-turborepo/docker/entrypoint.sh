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

apply_migrations() {
  echo "▶ Applying Prisma migrations (migrate deploy)..."
  cd "$DB_DIR"
  pnpm exec prisma migrate deploy
}

apply_force_reset() {
  echo "▶ Resetting database schema (db push --force-reset)..."
  cd "$DB_DIR"
  pnpm exec prisma db push --force-reset --accept-data-loss
}

run_seed() {
  echo "▶ Seeding database..."
  cd "$DB_DIR"
  node ./prisma/seed.mjs
}

case "$CMD_NAME" in
  start)
    apply_migrations
    if [ "$SEED_ON_START" = "true" ]; then
      run_seed
    fi
    echo "▶ Starting backend on port ${PORT:-8000}..."
    cd /app/apps/kbdl-backend
    exec node dist/server.js
    ;;
  seed)
    apply_migrations
    run_seed
    ;;
  reset-seed)
    apply_force_reset
    run_seed
    ;;
  migrate)
    apply_migrations
    ;;
  *)
    exec "$@"
    ;;
esac
