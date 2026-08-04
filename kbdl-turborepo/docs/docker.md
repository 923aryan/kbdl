# Docker stack (Postgres + Redis + Backend)

Runs **PostGIS Postgres**, **Redis**, and the **KBDL backend** in Docker.  
Employer / admin / landing frontends stay on your machine and call `http://localhost:8000`.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running  
  (`docker` must work in PowerShell — restart the terminal after install)
- Ports free: **5432**, **6379**, **8000** (or change them in `.env`)

## Env: `kbdl-turborepo/.env` (backend only)

Compose, local backend (`pnpm dev:backend`), and Prisma (`pnpm db:push` / `db:seed`) use this file.  
Employer UI uses `apps/kbdl-employer/.env` separately.  
Do not create `apps/kbdl-backend/.env` or `packages/db/.env`.

Create/edit `kbdl-turborepo/.env` with at least: `POSTGRES_*`, `REDIS_*`, `DATABASE_URL`, `REDIS_URL`, `JWT_*`, `RESEND_API_KEY`, `GEOAPIFY_API_KEY`, `S3_*`, `PORT`, `EMPLOYER_URL`.

| Variable | Used for |
|----------|----------|
| `POSTGRES_USER` | DB user |
| `POSTGRES_PASSWORD` | DB password |
| `POSTGRES_DB` | Default database name |
| `REDIS_PASSWORD` | Redis `requirepass` |
| `JWT_*` / `RESEND_*` / … | Backend |

`DATABASE_URL` / `REDIS_URL` for the backend are **built from those vars** in `docker-compose.yml`.

> Password changes only apply on a **fresh** Postgres volume. After changing `POSTGRES_PASSWORD`, run `docker compose down -v` then `up` again (wipes data).

## Start

```powershell
docker compose up --build
```

### Seed demo data

```powershell
docker compose run --rm backend seed
```

Logins: [seed-logins.md](./seed-logins.md)  
Demo: `employer@kbdl.dev` / OTP `123456` (if backend still hardcodes local OTP)

### Auto-seed on start (optional)

In `.env`:

```env
SEED_ON_START=true
```

Warning: seed **clears** tables first.

## Connect from outside (host / DBeaver / psql)

Values come from your `.env`:

```text
Host:     localhost
Port:     POSTGRES_PORT (default 5432)
Database: POSTGRES_DB
User:     POSTGRES_USER
Password: POSTGRES_PASSWORD
```

Example with typical local defaults:

```text
postgresql://kbdl:kbdl@localhost:5432/kbdl?schema=public
```

Redis:

```text
redis://:REDIS_PASSWORD@localhost:REDIS_PORT
```

## URLs

| Service | URL |
|---------|-----|
| Backend health | http://localhost:8000/health |
| API docs | http://localhost:8000/api/docs |
| Employer UI (host) | http://localhost:3002 → API localhost:8000 |

Frontends:

```powershell
pnpm dev:frontend
```

## Stop / reset

```powershell
docker compose down          # keep DB volume
docker compose down -v       # wipe Postgres + Redis volumes
```

## Only infra in Docker (backend on host)

```powershell
docker compose up postgres redis -d
```

Then set (in `kbdl-turborepo/.env` only):

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB?schema=public
REDIS_URL=redis://:REDIS_PASSWORD@localhost:6379
```

Backend and Prisma both read that single file — no `apps/kbdl-backend/.env` or `packages/db/.env`.

## Useful commands

```powershell
docker compose logs -f backend
docker compose ps
docker compose exec postgres psql -U %POSTGRES_USER% -d %POSTGRES_DB%
docker compose exec redis redis-cli -a %REDIS_PASSWORD% ping
```
