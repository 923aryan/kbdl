# Seed login credentials (`kbdl_dev`)

After `pnpm db:seed`, use these accounts for local/dev testing.

**Employer OTP (local/dev):** usually `123456`  
**Employer app:** http://localhost:3002  
**API:** http://localhost:8000

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

```powershell
cd kbdl-turborepo
pnpm db:seed
```
