# Docker stack (minimal: PostGIS + Redis + backend)

Backend Docker image installs **only** `kbdl-backend` workspace deps (no Next.js / frontend apps).  
See `Dockerfile` (`--filter kbdl-backend...`) and `.dockerignore`.

## Two ways to run

| Mode | Where | DB / Redis URL |
|------|--------|----------------|
| **A. Full Docker** (AWS server) | `docker compose up -d --build` | Container uses `postgres` / `redis` hostnames |
| **B. Host backend** (your PC) | `pnpm start:backend` | `.env` → `51.20.0.36:5432` / `:6379` |

Both share one `.env` at `kbdl-turborepo/.env`.  
Docker **backend container overrides** `DATABASE_URL` / `REDIS_URL` to internal service names.

## Prerequisites

- Docker installed
- Ports on server: **5432**, **6379**, **8000** (EC2 Security Group — restrict 5432/6379 to your IP in dev)
- Create/edit `kbdl-turborepo/.env` (copy the same file to the server)

## Env: `kbdl-turborepo/.env`

| Variable | Purpose |
|----------|---------|
| `REMOTE_DOCKER_HOST` | AWS public IP (`51.20.0.36`) — docs / reference |
| `POSTGRES_*` / `REDIS_*` | Docker Compose infra |
| `DATABASE_URL` / `REDIS_URL` | **Host-side** backend + Prisma (`pnpm start:backend`, `pnpm db:seed`) |
| `JWT_*`, `S3_*`, … | Shared by Docker backend via `env_file` |

**Local PC → remote Docker PG/Redis:**

```env
REMOTE_DOCKER_HOST=51.20.0.36
DATABASE_URL="postgresql://kbdl:kbdl@51.20.0.36:5432/kbdl?schema=public"
REDIS_URL="redis://:kbdlredis@51.20.0.36:6379"
```

Then on your PC:

```powershell
pnpm install:backend
pnpm --filter @repo/db generate
pnpm start:backend
```

**Backend on same machine as Docker (not in container):** use `127.0.0.1` instead of public IP in `DATABASE_URL` / `REDIS_URL`.

## AWS — full stack in Docker

```bash
cd ~/kbdl/kbdl-turborepo

# optional: 2G swap on small instances before first build
docker compose up -d --build
docker compose run --rm backend seed
curl http://127.0.0.1:8000/health
```

Or step by step:

```bash
pnpm docker:infra      # postgres + redis only
pnpm docker:backend    # build + start backend
pnpm docker:seed       # migrate + seed
```

## Seed / reset

```bash
docker compose run --rm backend seed        # migrate + seed
docker compose run --rm backend reset-seed  # wipe + seed (dev only)
```

Logins: [seed-logins.md](./seed-logins.md)

## URLs

| Service | URL |
|---------|-----|
| Backend (server) | http://51.20.0.36:8000 |
| Health | http://51.20.0.36:8000/health |
| API docs | http://51.20.0.36:8000/api/docs |
| Employer UI (local) | http://localhost:3002 |

Point employer `.env` API URL to `http://51.20.0.36:8000` when testing against remote backend.

## Stop / cleanup

```bash
docker compose down          # keep data volumes
docker compose down -v       # wipe PG + Redis data
docker system prune -f       # reclaim unused layers (keeps running containers)
docker volume prune -f       # unused volumes only
```

## Useful commands

```bash
docker compose ps
docker compose logs -f backend
docker compose exec postgres psql -U kbdl -d kbdl
docker compose exec redis redis-cli -a kbdlredis ping
```

## Small EC2 notes

- Use `pnpm install:backend` on host — never full `pnpm install` (pulls Next.js, OOM on 1GB RAM)
- Add 2G swap before `docker compose build`
- Prefer `docker compose up -d --build` over host `pnpm install` on the server
