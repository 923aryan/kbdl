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

echo "▶ Adding minimal build tools (tsx, tsup, prisma — no eslint/next)..."
pnpm add -D tsx tsup prisma --filter kbdl-backend --filter @repo/db

echo "▶ Prisma generate..."
pnpm --filter @repo/db generate

echo "▶ Building backend..."
pnpm --filter kbdl-backend build

echo ""
echo "✅ Setup done."
echo "▶ Disk after:"
df -h / | tail -1
echo ""
echo "Start production:  cd $ROOT && pnpm start:backend:prod"
echo "Start dev:         cd $ROOT && pnpm --filter kbdl-backend exec tsx watch --env-file=../../.env src/server.ts"
echo "PM2:               pm2 start \"pnpm start:backend:prod\" --name kbdl-backend --cwd $ROOT"
