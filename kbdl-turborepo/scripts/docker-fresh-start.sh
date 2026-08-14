#!/bin/sh
# Wipe everything and start fresh: Postgres + Redis + Backend (all Docker).
# WARNING: Deletes ALL database data (docker compose down -v).
#
# Usage: sh scripts/docker-fresh-start.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ Disk before:"
df -h / | tail -1

echo "▶ Stopping host backend (if PM2)..."
pm2 delete kbdl-backend 2>/dev/null || true
pm2 save 2>/dev/null || true

echo "▶ Removing host node_modules (not needed for Docker backend)..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules

echo "▶ Stopping stack + wiping DB/Redis volumes..."
docker compose down -v

echo "▶ Pruning old Docker layers (DB volumes already removed)..."
docker builder prune -af
docker image prune -af
docker container prune -f

echo "▶ Building backend image..."
docker compose build backend

echo "▶ Starting postgres + redis..."
docker compose up -d postgres redis

echo "▶ Waiting for postgres/redis healthy..."
sleep 8

echo "▶ Reset DB + seed demo data..."
docker compose run --rm backend reset-seed

echo "▶ Starting backend..."
docker compose up -d backend

echo "▶ Waiting for backend health..."
ATTEMPTS=0
until curl -sf "http://127.0.0.1:${PORT:-8000}/health" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 60 ]; then
    echo "⚠ Health timeout — check: docker compose logs backend"
    exit 1
  fi
  sleep 2
done

echo ""
echo "✅ Full Docker stack is up"
docker compose ps
echo "▶ Disk after:"
df -h / | tail -1
echo ""
echo "Health:  http://127.0.0.1:${PORT:-8000}/health"
echo "Public:  http://$(curl -sf ifconfig.me 2>/dev/null || echo SERVER_IP):${PORT:-8000}/health"
echo "Login:   employer@kbdl.dev / OTP 123456"
