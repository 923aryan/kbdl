# Onboarding guide: Arif → company owner → HR → company → employees

This is the end-to-end playbook for bringing a **company** onto KBDL.

**Chain**

1. **Arif** (product admin) onboards the **company** and **company owner**.
2. **Owner** logs into the employer app, fills **company details** (same form as HR), and **invites HR**.
3. **HR** logs in, completes **their employee profile**, and can also fill/update **company details**.
4. Arif **activates** the company.
5. **HR** onboards **employees**. Owner can do the same HR work if needed.

Related: [dev-links.md](./dev-links.md) · [seed-logins.md](./seed-logins.md)

---

## Two different “owners”

Do not mix these. They use different apps, tables, and login methods.

| Who | What they manage | App | Login | Database |
|-----|------------------|-----|--------|----------|
| **Founder (Arif)** | Whole platform: onboard company + owner, activate companies | **kbdl-admin** `http://localhost:3000` | Email **or** phone + **password** | `admins` |
| **Company owner** | One company: invite HR, high-level company control | **kbdl-employer** `http://localhost:3002` | Email + **OTP** | `users` + `company_members` with `company_roles.code = OWNER` |

HR is not an owner. HR is a **company employee with role HR**, plus employer-app access so they can run HR work.

| Who | App | Login | Database |
|-----|-----|--------|----------|
| **HR** | kbdl-employer | Email + OTP | `users` + `company_members` (`role = HR`, `platform_type = EMPLOYER`) + `employee_employments` + `employee_hr_profiles` |
| **Employee (staff/worker)** | employee app (phone OTP) after HR onboards them | Phone OTP | `workforce_persons` + `employee_employments` + `employee_hr_profiles` + `company_members` (`role = EMPLOYEE`, `platform_type = EMPLOYEE`) |

---

## Apps and API

| What | URL |
|------|-----|
| Founder console | http://localhost:3000 |
| Employer app (owner + HR) | http://localhost:3002 |
| API | http://localhost:8000/api/v1 |
| Swagger | http://localhost:8000/api/docs |
| Health | http://localhost:8000/health |

Local/dev employer OTP is **`123456`**.

---

## Arif founder login

After seed (`pnpm db:seed`), use:

| Name | Email | Phone | Password |
|------|-------|-------|----------|
| mdarif | `mdarif@kbdl.dev` | `+919876540001` | `Mdarif@123456` |
| KBDL Admin (backup) | `admin@kbdl.dev` | `+919000000000` | `Admin@123456` |

Stored in table `admins` (`name`, `email`, `phone_no`, `password_hash`).

If seed has not been run after the admin-phone change, apply schema then seed or insert this admin row.

---

## Target flow (what we want)

```
Arif (founder console)
  → onboard company OWNER (company founder/admin of that company)
      → OWNER logs into employer app
          → onboard HR (invite email + phone + name)
              → HR logs into employer app
                  → complete company + own HR profile
                      → Arif sets company status = active
                          → HR onboards employees
```

### Step 1 — Arif onboards an owner

1. Open http://localhost:3000 and sign in as Arif.
2. Create / invite the **company owner** with:
   - full name
   - email (this is their employer-app login)
   - phone (`+91` + 10 digits)
3. Owner account should be:
   - a `users` row
   - a `company_members` row with `platform_type = EMPLOYER` and role **OWNER**
   - **not** a row in `admins`

Owner does **not** use the founder password login.

### Step 2 — Owner onboards HR

1. Owner opens http://localhost:3002.
2. Request OTP on the owner **email**, enter `123456`.
3. Owner invites HR with name, email, phone.
4. HR is created as:
   - `users` (login)
   - later, when the company exists: `company_members` role **HR**
   - `workforce_persons` + `employee_employments` + `employee_hr_profiles` (HR is a roster employee)

Use a phone that is **not** already a worker in seed (for example do **not** reuse `+917275890926`).

### Step 3 — HR completes the company

1. HR opens http://localhost:3002, email OTP `123456`.
2. If they have no company yet, they land on **company onboard** (`/company/onboard`).
3. HR fills:
   - **Own profile:** name, DOB, gender, address (email/phone come from the invite)
   - **Company:** name, address, state, GST, PAN, EPF, ESIC
4. Submit for review.

Company row is `companies`. Status starts as `onboarding` or `pending_review`. Attendance / leave / payroll stay closed until **active**.

HR themselves should appear on the employee roster with designation/department **HR** and role **HR**.

### Step 4 — Arif activates the company

1. Wait until the company owner (or HR) clicks **Submit for review**. Status must be **`pending_review`**.
2. Arif in founder console → Companies.
3. Set status to **`active`**. Active is blocked while status is still **`onboarding`**.
4. That sets `companies.status = active` and `companies.is_verified = true`.

Other statuses: `onboarding` · `pending_review` · `active` · `suspended` · `rejected`.

### Step 5 — HR onboards employees

1. HR logs into employer app again (company must be **active**).
2. **Employees → Onboard** (`/employees/onboard`) for one person, or CSV import from the employees screen.
3. Each employee gets employment + HR profile + member with role **EMPLOYEE**.
4. After that, workers can use the **employee app** with **phone OTP**.

CSV template: `GET /api/v1/operations/employer/employees/import/template`  
Upload: `POST /api/v1/operations/employer/employees/import`

---

## Where each record is stored

| Record | Table(s) | Notes |
|--------|----------|--------|
| Arif / founder | `admins` | Password login only |
| Company | `companies` | `status` + `is_verified` |
| Company owner login | `users` | Email + phone |
| Owner membership | `company_members` | `role_id` → `company_roles.code = OWNER`, usually **no** `employment_id` |
| HR invite | `hr_invites` | Created by founder today; target is owner-created |
| HR login | `users` | Email OTP |
| HR as employee | `workforce_persons`, `employee_employments`, `employee_hr_profiles` | Same shape as a normal employee |
| HR portal access | `company_members` | `role = HR`, `platform_type = EMPLOYER`, `employment_id` set |
| Other employees | same HRMS tables | `role = EMPLOYEE`, `platform_type = EMPLOYEE` |
| Roles catalog | `company_roles` | Per company: OWNER, ADMIN, HR, EMPLOYEE, … |

Company owner is **not** `admins`. Founder is **not** `company_members`.

---

## How to run this today (software as of this doc)

The **intended** chain is Arif → owner → HR → company → employees.

What the apps do **today**:

| Intended step | What works now |
|---------------|----------------|
| Arif onboards **owner** | Not a separate “invite owner” screen yet. Owner is created by **employer register** (`POST /api/v1/auth/register/employer` + verify OTP) or by **seed**. |
| Owner onboards **HR** | Not on the employer app yet. **Arif** invites HR from founder console → **HR invites** (`POST /api/v1/admin/hr-invites`). |
| HR completes **company** | Works. Invited HR logs into employer app → `/company/onboard` (own profile + company). |
| Arif activates company | Works. Founder console → company status **active**. |
| HR onboards employees | Works after the company is **active**. Employees onboard / CSV. |

### Practical test path today

1. **Arif** — http://localhost:3000 — `mdarif@kbdl.dev` / `Mdarif@123456`.
2. **Invite HR** — name, email, phone (unique).
3. **HR** — http://localhost:3002 — invited email, OTP `123456`.
4. Complete **HR profile + company**, submit for review.
5. **Arif** sets company **active**.
6. **HR** onboards employees.

To also test a **company owner** on a seeded company: employer app as `employer@kbdl.dev`, OTP `123456` (KBDL Corp). That owner is already in `company_members` with role OWNER.

---

## Useful APIs

| Step | Method | Path |
|------|--------|------|
| Founder login | `POST` | `/api/v1/auth/admin/login` body `{ "email": "...", "password": "..." }` (`email` may be a phone) |
| Invite HR (today) | `POST` | `/api/v1/admin/hr-invites` |
| List invites | `GET` | `/api/v1/admin/hr-invites` |
| List companies | `GET` | `/api/v1/admin/companies` |
| Set company status | `PATCH` | `/api/v1/admin/companies/:companyId/status` |
| Employer OTP | `POST` | `/api/v1/auth/employer/send-otp` |
| Employer verify | `POST` | `/api/v1/auth/employer/verify-otp` |
| Register owner (self-serve) | `POST` | `/api/v1/auth/register/employer` then `/register/employer/verify` |
| Get/save company + HR profile | `GET`/`PUT` | `/api/v1/operations/employer/company` |
| Onboard employee | `POST` | `/api/v1/operations/employer/onboard` |

Auth header: `Authorization: Bearer <accessToken>`.

---

## Checklist

- [ ] Arif can sign in on port **3000** with email or phone + password.
- [ ] Company owner is a `users` + OWNER member, not an `admins` row.
- [ ] HR can sign in on port **3002** with email OTP.
- [ ] HR is on the roster (employment) with role **HR** and can still use the employer app.
- [ ] Company stays in `pending_review` until Arif sets **active**.
- [ ] After **active**, HR can onboard employees and run attendance / leave / payroll.
- [ ] Employees are not founders and not company owners.

---

## Example test identities (suggested)

Use **new** phones/emails so they do not clash with seed workers.

| Role | Example email | Example phone |
|------|----------------|---------------|
| Founder Arif | `mdarif@kbdl.dev` | `+919876540001` |
| Company owner | `owner.company1@kbdl.dev` | `+919811110001` |
| HR | `hr.company1@kbdl.dev` | `+919811110002` |
| Employee 1 | (created by HR) | `+919811110003` |
