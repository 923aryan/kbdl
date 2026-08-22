# Seed login credentials

After `pnpm db:seed` or `docker compose run --rm backend seed`, use these accounts for local/dev testing.

**Employer OTP (local/dev):** usually `123456`

Useful URLs (Swagger, OpenAPI, apps): [dev-links.md](./dev-links.md)

## Company owners (employer login)

One OWNER per company — email OTP login on the employer app.

| Company | Email | Phone |
|---------|-------|-------|
| KBDL Corp | `employer@kbdl.dev` | `+919876543210` |
| Aryan Corp | `aryan.corp@kbdl.dev` | `+919934853183` |
| Atrinity | `atrinity1@kbdl.dev` | `+918360170678` |
| Atrinity North | `atrinity2@kbdl.dev` | `+917888346624` |
| Atrinity South | `atrinity3@kbdl.dev` | `+918054224492` |
| Test Works | `test.works@kbdl.dev` | `+918894853644` |
| Panesar Logistics | `panesar@kbdl.dev` | `+919876543217` |
| Alok Services | `alok@kbdl.dev` | `+911234567890` |
| Srivastava Staffing | `srivastava@kbdl.dev` | `+919999999999` |
| Kaam Badlo Ops | `ops@kbdl.dev` | `+919006598289` |

Primary demo account: **`employer@kbdl.dev`** / OTP **`123456`**

## Extra company staff (same company, not owners)

These are `CompanyMember`s with roles via `role_id` (not platform admin).

| Email | Company | Role code |
|-------|---------|-----------|
| `admin.staff@kbdl.dev` | KBDL Corp | ADMIN |
| `hr.staff@kbdl.dev` | KBDL Corp | HR |
| `recruiter@kbdl.dev` | KBDL Corp | RECRUITER |
| `finance@kbdl.dev` | KBDL Corp | FINANCE |
| `payroll@kbdl.dev` | KBDL Corp | PAYROLL_CLERK |
| `aryan.admin@kbdl.dev` | Aryan Corp | ADMIN |
| `aryan.warehouse@kbdl.dev` | Aryan Corp | WAREHOUSE_LEAD |

## July payroll test data

`pnpm --filter @repo/db run seed:july-payroll` fills **July 2026** for every company that has active employees:

- Attendance every calendar day (present / OT / half-day / absent / leave / Sunday week-off / 17 Jul holiday)
- Approved leave on 8–9 Jul (first worker) and 22 Jul (second worker)
- Daily/monthly rates, EPF/ESIC flags, bank or UPI details
- Existing July payroll run is deleted so Run Payroll rebuilds from this snapshot

Then in the employer app: **Payroll → Run Payroll → July 2026**.

> Note: employer OTP login today is wired for company **OWNER** accounts. Staff may not log into the employer portal until that flow supports non-owner members.

## Workers (employee app — phone OTP)

| Name | Phone | Email |
|------|-------|-------|
| Ravi Kumar | `+919876543211` | `worker1@kbdl.dev` |
| Aman Singh | `+919876543212` | `worker2@kbdl.dev` |
| Priya Sharma | `+919876543213` | `worker3@kbdl.dev` |
| Dev Kumar | `+918707462709` | `worker4@kbdl.dev` |
| Rajeev Pal | `+919006598280` | `worker5@kbdl.dev` |
| Arif Khan | `+917275890926` | `worker6@kbdl.dev` |
| Test Worker | `+911234567898` | `worker7@kbdl.dev` |

## Platform admin (kbdl-admin)

| Email | Notes |
|-------|--------|
| `admin@kbdl.dev` | Platform `Admin` table — not a company owner. Password hash in seed is placeholder (`seed-not-for-login`). |

## Re-seed

Ensure `kbdl-turborepo/.env` has **`DATABASE_URL`** (or `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`).

```powershell
cd kbdl-turborepo

# Apply migrations + generate client + seed (keeps schema, replaces demo data)
pnpm --filter @repo/db run migrate:deploy
pnpm --filter @repo/db run generate
pnpm --filter @repo/db run seed

# Or seed only (clears + re-inserts demo rows)
pnpm db:seed

# Dev only — wipes ALL tables then seeds
pnpm --filter @repo/db run db:reset-seed
```
