#!/bin/sh
# Restart backend only. Cleans dangling images/build cache/containers.
# Does NOT remove postgres/redis or DB volumes (kbdl_pgdata, kbdl_redisdata).

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ Disk before cleanup:"
df -h / | tail -1

echo "▶ Stopping backend (postgres + redis keep running)..."
docker compose stop backend 2>/dev/null || true
docker compose rm -f backend 2>/dev/null || true

echo "▶ Removing old backend image (if any)..."
BACKEND_IMG="$(docker compose images backend -q 2>/dev/null | head -1 || true)"
if [ -n "$BACKEND_IMG" ]; then
  docker rmi -f "$BACKEND_IMG" 2>/dev/null || true
fi

echo "▶ Pruning unused Docker data (NOT volumes — DB data safe)..."
docker container prune -f
docker image prune -af
docker builder prune -af
docker network prune -f

echo "▶ Rebuild + start backend..."
docker compose up -d --build --force-recreate backend

echo "▶ Waiting for health..."
ATTEMPTS=0
until curl -sf "http://127.0.0.1:${PORT:-8000}/health" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 30 ]; then
    echo "⚠ Health check timeout — check logs: docker compose logs backend"
    exit 1
  fi
  sleep 2
done

echo "✅ Backend is up"
docker compose ps backend
echo "▶ Disk after cleanup:"
df -h / | tail -1
