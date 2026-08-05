# Employer HR Backend Delivery Plan (Manager Brief)

**Prepared for:** Manager / stakeholders  
**Scope:** KBDL Employer — **Employees**, **Payroll**, **Leave**  
**Context:** UI screens already exist (mostly **static/mock**). Backend must design data models, business rules, secure APIs, and contracts so frontend can integrate.  
**Important:** This is **not** “expose a few GET/POST endpoints.” Each feature needs schema design, company-scoped auth, validation, edge cases, calculation engines, docs, and FE support.

**Revised estimate**
| Module | Calendar effort | Why it is heavy |
|--------|-----------------|-----------------|
| Employees (list + onboard) | **5 working days** | Multi-table writes, draft/submit, meta dropdowns, filters |
| Employee profile (6 tabs) | **5 working days** | Nested profile, docs upload, attendance, payment history |
| **Payroll core** | **10 working days** | Multi-stage workflow, wage/deduction engine, disbursement, payslips |
| Leave + settings + harden | **5 working days** | Approval workflow + policy + polish |
| **Total** | **~25 working days (~5 weeks)** | Parallel FE integration from week 1 |

---

## Why “just APIs” is misleading

For every screen, backend work includes:

1. **Domain / DB design** — new tables or extensions (employment, docs, payroll runs, leave requests, statutory) aligned to Company / CompanyMember / Department / roles  
2. **Authorization** — every call scoped to logged-in employer’s `company_id`; role checks (OWNER/ADMIN/HR/FINANCE)  
3. **Validation & contracts** — Zod/OpenAPI request-response; FE contract freeze meetings  
4. **Business rules** — status machines (draft → probation → active); payroll stage locks; leave balance math  
5. **Transactions & consistency** — onboard creates User + Member + Employment atomically; payroll run must not double-disburse  
6. **Integrations** — file storage for documents/payslips; optional SMS/email on send payslip / leave status  
7. **Seed + migration** — demo data matching UI so FE can integrate without waiting for real HR data  
8. **Testing & docs** — happy path + edge cases; Swagger; Postman; handoff notes for FE  

---

## Current frontend audit (effort driver)

| Area | Screens (already built in UI) | Backend today |
|------|-------------------------------|---------------|
| **Employees** | List, Details (Personal / Job / Documents / Bank / Attendance / Leave tabs), Add Onboard | Only thin onboard API (phone/karigari/employee_no) |
| **Payroll** | 4-step Run Payroll, Worker Wages, Payslips, Statutory Filing, Settings | **Zero** APIs — 100% mock |
| **Leave** | Nav items Apply / Requests (**pages not built**); Leave tab in employee details | **Zero** APIs |

---

# Phase A — Week 1 (5 days): Employee directory + onboarding

**Goal:** Replace employee list mock + make “Add New Onboard” production-capable.

### Day-by-day backend work

| Day | Work package (not just “one API”) |
|-----|-----------------------------------|
| **D1** | Map UI list columns → DB (User, CompanyMember, EmployeeEmployment, ratings). Design list DTO. Company-scoped query plan + indexes. Auth middleware path for employer. |
| **D2** | Implement `GET .../employees` with search, multi designation, multi status, pagination, sort. Empty/error states. Unit/integration tests for filters. |
| **D3** | Meta APIs for dropdowns used by filters + onboard: designations, departments, branches/locations, supervisors (members), shifts. Align with CompanyRole / Department catalogs. |
| **D4** | Expand onboard domain: draft vs submit; field mapping for personal + job + payment + identity + salary; unique employee_no / phone rules; status `Onboard` / `Probation`. |
| **D5** | Transactional `POST .../onboard` (create/link User, membership, employment, optional bank/UPI). OpenAPI + seed 20–50 employees. FE contract review + fix response mismatches. |

### APIs delivered (Phase A)
- `GET /api/v1/operations/employer/employees`
- `GET /api/v1/operations/employer/meta/designations|departments|branches|supervisors|shifts`
- `POST /api/v1/operations/employer/onboard` (**full body**, draft/submit)

### Exit criteria
- List + filters work against real DB  
- Onboard form can create a real employee end-to-end  
- Swagger + sample Postman collection handed to FE  

### FE parallel
Wire list + onboard form; keep details tabs on mock until Phase B.

---

# Phase B — Week 2 (5 days): Employee profile (all detail tabs)

**Goal:** Eye icon → full profile from API; edit/save; docs; attendance MVP; payment history.

### Day-by-day backend work

| Day | Work package |
|-----|----------------|
| **D1** | Aggregate profile read model (personal, contact, emergency, identity, job, reporting, salary). `GET .../employees/:id`. Handle missing optional sections. |
| **D2** | Partial update design (section-wise PATCH). Optimistic concurrency / updated_at. Audit which fields HR can edit vs locked. Implement `PATCH .../employees/:id`. |
| **D3** | Documents: table + upload flow (multipart or signed URL). Virus/size/type validation. `GET/POST .../documents`. Status/expiry fields for UI. |
| **D4** | Attendance MVP: month grid data model (P/A/L/H/OF); generate or read from shifts if available; `GET .../attendance?month=` + daily logs. Define source-of-truth rules. |
| **D5** | Payment history read API; payslip stub link; OpenAPI for profile; seed rich profile for 5 demo employees; FE support for tab wiring. |

### APIs delivered (Phase B)
- `GET/PATCH .../employees/:id`
- `GET/POST .../employees/:id/documents`
- `GET .../employees/:id/attendance` (+ logs)
- `GET .../employees/:id/payment-history`

### Exit criteria
- All 6 UI tabs can load from API (Leave tab can stay stub until Phase D)  
- Edit personal/job persists  
- Document upload path works in staging  

---

# Phase C — 10 working days: Payroll core (HEAVIEST)

**Goal:** Power the entire Payroll menu used by UI: Run Payroll (4 stages), Worker Wages, Payslips.  
**Why 10 days:** This is a **workflow + calculation product**, not a CRUD list.

### What must be built under the hood

| Layer | Concrete work |
|-------|----------------|
| **Schema** | `payroll_runs`, `payroll_run_employees`, attendance snapshot rows, wage lines, deduction lines, disbursement records, worker wage masters, payslip records |
| **State machine** | Run stages: `attendance → wages → deductions → disburse` with **lock** after confirm (no silent edits) |
| **Calculation engine** | Present/leave/absent/OT → payable days; daily/monthly rates → basic + OT + allowances → gross; EPF/ESIC/TDS/LWF/advance → net |
| **Config** | Company statutory % and pay-cycle settings (even if UI settings API lands later, engine needs defaults) |
| **Idempotency** | Disburse once; regenerate payslip safely; prevent double submit |
| **Money safety** | Decimal precision, rounding rules, audit fields (who confirmed which stage) |
| **Auth** | Prefer FINANCE/OWNER/ADMIN for disburse; HR for attendance edits |

### Day-by-day (10 days)

| Day | Work package |
|-----|----------------|
| **D1** | Payroll domain workshop + ERD. Map every UI column on all 4 Run steps to DB fields. Define month/period key, company scope, statuses. |
| **D2** | Migrations for payroll tables + indexes. Seed wage masters for existing employees. Repository layer. |
| **D3** | `POST/GET payroll/runs` — create run for month from active employees; clone attendance baseline; list/get run summary (stats cards). |
| **D4** | Attendance stage APIs: list, patch employee attendance (present/leave/absent/OT/payable days), flag rows, **confirm attendance** (locks stage). |
| **D5** | Wage calculation service: rate × days, OT pay, allowances → gross. `GET/PATCH wages` + confirm. Handle edits after recalc. |
| **D6** | Deduction engine: EPF/ESIC/TDS/LWF/advance rules from company config; add custom deduction; totals → net. Confirm deductions stage. |
| **D7** | Disburse: NEFT/UPI/Cash method; draft vs confirm; write disbursement + bank snapshot; mark run completed; failure/rollback cases. |
| **D8** | Worker Wages master APIs (list/filter/patch rates, contract type, EPF/ESIC flags, payment mode) — feeds future runs. |
| **D9** | Payslips: generate from completed run lines; list statuses (Generated/Sent/Pending); download file (PDF or structured file); send (email/notify stub). |
| **D10** | Hardening: OpenAPI for all payroll endpoints; Postman; integration tests for full run happy path + double-disburse guard; FE contract walkthrough; bugfix from FE wiring. |

### APIs delivered (Phase C) — many coordinated endpoints

**Run lifecycle**
- `POST/GET .../payroll/runs`
- `GET/PATCH .../payroll/runs/:id/attendance` + `POST .../confirm-attendance`
- `GET/PATCH .../payroll/runs/:id/wages` + `POST .../confirm-wages`
- `GET/PATCH .../payroll/runs/:id/deductions` (+ add deduction) + `POST .../confirm-deductions`
- `POST .../payroll/runs/:id/disburse` (draft \| confirm)

**Masters & outputs**
- `GET/PATCH .../payroll/worker-wages`
- `GET .../payroll/payslips` + download + send  

*(Statutory filing UI can use stubs or thin list in Phase D if needed.)*

### Exit criteria
- FE can complete one full month: Attendance → Wages → Deductions → Disburse against API  
- Net pay matches engine rules for seeded workers  
- Payslips appear after disburse  
- Swagger complete for payroll core  

### FE parallel (during these 10 days)
Days 1–3: FE prep types/hooks; Days 4–10: wire stepper progressively as each stage ships.

---

# Phase D — 5 working days: Leave + payroll settings/statutory + buffer

**Goal:** Leave workflows + remaining payroll screens + demo stability.

| Day | Work package |
|-----|----------------|
| **D1** | Leave schema: types, balances, policy text, requests; allocation rules per employee. |
| **D2** | `POST leave/apply`, balance checks, overlap validation; list my/company requests. |
| **D3** | Approve/reject with balance commit; notifications stub; Employee Details Leave tab APIs. |
| **D4** | `GET/PUT payroll/settings`; statutory obligations list + mark filed + history MVP. |
| **D5** | Cross-module bugfix, seed for demo script, OpenAPI polish, joint FE UAT support. |

### APIs delivered (Phase D)
- Leave: balances, types, policy, apply, list requests, approve/reject  
- `GET/PUT .../payroll/settings`  
- `GET/POST .../payroll/statutory` (+ history)  

### Exit criteria
- Leave apply + manager approve/reject works  
- Settings persist and affect next payroll run defaults  
- End-to-end demo path signed off with FE  

---

## Calendar view (share this table)

| Week | Phase | Focus | Backend outcome | Demoable |
|------|-------|--------|-----------------|----------|
| **Week 1** | A (5d) | Employees list + onboard | Directory + full onboard | Yes |
| **Week 2** | B (5d) | Employee profile tabs | View/edit + docs + attendance MVP | Yes |
| **Week 3** | C days 1–5 | Payroll foundation + attendance + wages | Run created; stages 1–2 live | Partial payroll |
| **Week 4** | C days 6–10 | Deductions, disburse, wages master, payslips | Full payroll core | Yes — full run |
| **Week 5** | D (5d) | Leave + settings + statutory + harden | Leave + polish | Full HR path |

> If leadership needs a hard **4-week** cut: keep Phases A–C (employees + **10-day payroll**), move Leave/statutory to Week 5 / next sprint.

---

## Collaboration model (makes work visible)

| Cadence | Activity |
|---------|----------|
| Mon | Contract freeze for that week’s DTOs (backend + FE) |
| Tue–Thu | Backend implementation + FE starts integration as endpoints land |
| Fri | Joint demo + bug list + next week risk review |
| Ongoing | Swagger is source of truth; breaking changes only with version note |

**Roles**
- **Backend (you):** schema, rules engine, APIs, auth, tests, docs, seed  
- **Frontend:** replace mocks, build missing Leave pages, UX edge cases  
- **Manager visibility:** weekly demo against real APIs, not “API done on paper”  

---

## Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payroll rules (EPF/ESIC/TDS) debated mid-sprint | Slip | Freeze formula sheet Day 1 of Phase C; settings-driven rates |
| Treating payroll as “CRUD APIs” | Underestimate / quality issues | Keep 10-day allocation; stage locks + calc tests mandatory |
| File/PDF generation slow | Payslip delay | Metadata first; PDF template iteration in buffer |
| Leave UI pages missing | FE blocked | APIs ready Week 5; FE builds pages in parallel Weeks 3–5 |
| Attendance vs shifts complexity | Scope creep | MVP = employer-verified snapshot for the run, not live shift sync |

---

## Payroll Settings data model (agreed approach)

UI: `/payroll/settings` — one screen, **four settings domains** (+ company compliance fields).  
Design: **separate table per domain**, `company_id` unique (1 row per company).  
API: still expose as one aggregate `GET/PUT .../payroll/settings` (backend reads/writes all tables in a transaction).

### `companies` (existing — extend, do not duplicate)

Reuse current `companies` table (`company_name`, `gst_number`, `company_address`, …).  
Add compliance columns when needed (or a thin `company_compliance` later):

```text
companies
---------
id
company_name
company_address
gst_number
# add as needed for Settings → Company Details:
# epf_registration_no
# esic_code
# pan
# state
# email / phone already live on owner User via CompanyMember
preferences  (json — keep non-payroll prefs here)
...
```

### `payroll_settings` (pay cycle)

```text
payroll_settings
----------------
id
company_id              (FK → companies, UNIQUE)
pay_frequency           (e.g. monthly)
pay_day                 (e.g. last_working_day)
payroll_cutoff_day      (e.g. 28)
financial_year_start    (e.g. april)
lock_after_processing   (boolean)
created_at
updated_at
```

### `statutory_settings`

```text
statutory_settings
------------------
id
company_id              (FK → companies, UNIQUE)
employee_pf_rate        (decimal — e.g. 12.00 = 12%)
employer_pf_rate
employee_esic_rate
employer_esic_rate
professional_tax        (decimal amount / month, or structured later)
labour_welfare_fund
created_at
updated_at
```

### `attendance_settings` (OT + attendance rules)

```text
attendance_settings
-------------------
id
company_id              (FK → companies, UNIQUE)
overtime_multiplier     (decimal — e.g. 1.5)
max_ot_hours_per_day    (int / decimal)
half_day_percentage     (decimal — e.g. 50)
absent_deduction_type   (e.g. per_day_rate)
auto_calculate_ot       (boolean)
created_at
updated_at
```

### `payment_settings` (disbursement)

```text
payment_settings
----------------
id
company_id                    (FK → companies, UNIQUE)
default_disbursement_method   (NEFT | UPI | CASH)
allow_bank_transfer           (boolean)
allow_upi                     (boolean)
allow_cash                    (boolean)
created_at
updated_at
```

### API contract (FE)

```http
GET  /api/v1/operations/employer/payroll/settings
PUT  /api/v1/operations/employer/payroll/settings
```

Response groups match UI sections: `pay_cycle`, `statutory`, `attendance`, `payment`, `company_details`.  
Optional later: `PATCH .../payroll/settings/statutory` for section-only saves.

### Defaults

On company create (or first GET settings): upsert default rows for all four tables so the Settings page never 404s.

---

## One-slide summary for manager

**Problem:** Employer Employees / Payroll / Leave UIs are built on **static data**. Backend must deliver a real HR + payroll system behind them.

**Effort (revised):**
- Employees list + onboard: **1 week**  
- Employee profile: **1 week**  
- **Payroll core: 10 working days** (workflow + wage/deduction engine + disburse + payslips — not “a few APIs”)  
- Leave + settings + hardening: **1 week**  

**Total: ~5 weeks** with weekly demos.  
**FE integrates in parallel** once Week 1 contracts ship.

**Success:** Employer can onboard employees, view/edit profiles, run a full monthly payroll, issue payslips, and process leave — all against production-shaped APIs documented in Swagger.
