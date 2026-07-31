#!/bin/sh
set -e

CMD_NAME="${1:-start}"

echo "▶ Waiting for Postgres..."
ATTEMPTS=0
MAX_ATTEMPTS=60
# Host/user from compose service defaults (override via PGHOST/PGUSER if needed)
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

echo "▶ Applying Prisma schema (db push)..."
cd /app/packages/db
pnpm exec prisma db push --skip-generate

if [ "$SEED_ON_START" = "true" ]; then
  echo "▶ Seeding database (SEED_ON_START=true)..."
  node ./prisma/seed.mjs
fi

cd /app/apps/kbdl-backend

case "$CMD_NAME" in
  start)
    echo "▶ Starting backend on port ${PORT:-8000}..."
    exec node dist/server.js
    ;;
  seed)
    echo "▶ Running seed only..."
    cd /app/packages/db
    exec node ./prisma/seed.mjs
    ;;
  *)
    exec "$@"
    ;;
esac
