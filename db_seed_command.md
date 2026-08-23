All of these are run from **`kbdl-turborepo`**, not the git root.

```bash
cd /home/md-arif/kbdl/kbdl-turborepo
```

---

### Mode 1 — backend in Docker, employer on your machine

Postgres + Redis + API live in Docker. Next.js stays on the host.

```bash
pnpm docker:up              # postgres + redis + backend
pnpm docker:seed            # seed inside the backend container
pnpm docker:logs            # follow API logs

pnpm dev:employer           # employer UI on the host
```

API: `http://localhost:8000`  
Employer: `http://localhost:3000` (or whatever Next prints)

Do **not** also run `pnpm dev:backend` — port 8000 is already used by the container.

Rebuild API after backend/schema changes:

```bash
pnpm docker:backend
```

---

### Mode 2 — only DB in Docker, backend + employer on the host

This is the usual local setup.

```bash
pnpm docker:infra           # postgres + redis only
pnpm db:push                # apply schema to Docker Postgres
pnpm db:seed                # seed from the host (uses DATABASE_URL in .env)

pnpm dev:backend            # API on the host
pnpm dev:employer           # employer UI on the host
```

`kbdl-turborepo/.env` must point at **localhost**, not the Docker service names:

```env
DATABASE_URL=postgresql://kbdl:YOUR_PASSWORD@localhost:5432/kbdl?schema=public
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@localhost:6379
```

Employer API URL (`apps/kbdl-employer/.env` if you have one):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

### Quick “which command?”

| What you want | Command | Where it runs |
|---|---|---|
| Start Postgres + Redis | `pnpm docker:infra` | Docker |
| Start Postgres + Redis + backend | `pnpm docker:up` | Docker |
| Seed while backend is in Docker | `pnpm docker:seed` | Docker |
| Seed while backend is on the host | `pnpm db:seed` | Host |
| Push Prisma schema (host, DB in Docker) | `pnpm db:push` | Host → Docker DB |
| Run API on the host | `pnpm dev:backend` | Host |
| Run employer UI | `pnpm dev:employer` | Host |
| Stop Docker stack | `pnpm docker:down` | Docker |

Pick **one** API: either Docker backend **or** `pnpm dev:backend`, never both.