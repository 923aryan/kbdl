#!/bin/sh
# AWS / small server: backend only — NO frontend apps, NO Next.js.
# Requires: Node 18+, pnpm 9, Postgres + Redis (Docker), kbdl-turborepo/.env with 127.0.0.1
#
# Usage: sh scripts/server-backend-setup.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ Disk before:"
df -h / | tail -1

echo "▶ Removing frontend apps (not needed on server)..."
rm -rf apps/kbdl-employer apps/kbdl-admin apps/kbdl-landing apps/kbdl-employee

echo "▶ Cleaning node_modules..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules

echo "▶ Installing backend PRODUCTION deps only (skips eslint/next dev chain)..."
pnpm install --filter kbdl-backend... --frozen-lockfile --prod

echo "▶ Installing global build tools (small — prisma, tsx, tsup)..."
sudo npm install -g prisma@7.8.0 tsx@4.21.0 tsup@8.5.1 typescript@6.0.3

echo "▶ Prisma generate..."
cd "$ROOT/packages/db"
prisma generate

echo "▶ Building backend..."
cd "$ROOT/apps/kbdl-backend"
tsup

echo ""
echo "✅ Setup done."
echo "▶ Disk after:"
df -h / | tail -1
echo ""
echo "Start production:  cd $ROOT && pnpm --filter kbdl-backend start"
echo "Start dev (tsx):   cd $ROOT/apps/kbdl-backend && tsx watch --env-file=../../.env src/server.ts"
echo "Or with PM2:       pm2 start \"pnpm --filter kbdl-backend start\" --name kbdl-backend"
