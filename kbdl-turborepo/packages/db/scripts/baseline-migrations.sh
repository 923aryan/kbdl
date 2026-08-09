#!/bin/sh
# Mark all SQL migrations as applied (after db push --force-reset + seed).
set -e

DB_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DB_DIR"

run_prisma() {
  if [ -f ./scripts/prisma-cli.mjs ]; then
    node ./scripts/prisma-cli.mjs "$@"
  else
    pnpm exec prisma "$@"
  fi
}

echo "▶ Baselining Prisma migration history..."
for migration_dir in prisma/migrations/*/; do
  [ -d "$migration_dir" ] || continue
  migration_name=$(basename "$migration_dir")
  echo "  • $migration_name"
  run_prisma migrate resolve --applied "$migration_name"
done
echo "✅ Baseline complete"
