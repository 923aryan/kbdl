# Company data model — how tables fit, sample data, common SQL

This doc explains the HRMS/org tables after the Employer → Company refactor.
Table names match Prisma `@@map(...)` (Postgres).

Related: [seed-logins.md](./seed-logins.md)

---

## 1. How tables are organised

```
users                          ← login identity (email / phone / profile)
   │
   └── company_members         ← "this user belongs to this company"
          │   company_id
          │   department_id?       → departments
          │   team_id?             → teams
          │   role_id              → company_roles   (NOT a free string)
          │   manager_company_member_id?  → company_members (self)
          │
          ├── companies
          │      └── departments   (self: parent_department_id)
          │             └── teams  (lead_company_member_id → company_members)
          │                    └── company_roles  (catalog per company)
          │
          └── shifts / jobs        (scoped by company_id, optional dept/team)
                 └── shift_applications (user applies to a shift)
```

### What each core table is for

| Table | Purpose |
|-------|---------|
| `users` | Person identity + auth fields |
| `companies` | The organisation |
| `company_roles` | Per-company role catalog (`OWNER`, `ADMIN`, custom…). Members point here by id |
| `departments` | Per-company depts; nest via `parent_department_id` |
| `teams` | Group inside a department |
| `company_members` | Membership + role + dept/team + **manager hierarchy** |
| `shifts` | One work slot owned by a company |
| `shift_applications` | Worker applied / invited to a shift |
| `jobs` / `job_applications` | Longer hiring posts |
| `admins` | **Platform** admin (KBDL ops) — not a company role |

### Two hierarchies (don’t mix them)

| Hierarchy | Table | Self-FK |
|-----------|-------|---------|
| Who reports to whom | `company_members` | `manager_company_member_id` |
| Dept under dept | `departments` | `parent_department_id` |

Roles are **not** a hierarchy — they are a catalog. Permission level is `company_roles.code` / future `permissions` JSON.

---

## 2. How data looks (tiny example)

Imagine **KBDL Corp**.

### `companies`

| id | company_name |
|----|--------------|
| `c1` | KBDL Corp |

### `company_roles` (each company has its own rows)

| id | company_id | code | name |
|----|------------|------|------|
| `r-owner` | `c1` | OWNER | Owner |
| `r-mgr` | `c1` | MANAGER | Manager |
| `r-emp` | `c1` | EMPLOYEE | Employee |
| `r-site` | `c1` | SITE_SUPERVISOR | Site Supervisor |

Rename `name` anytime; members keep `role_id`.

### `departments`

| id | company_id | name | parent_department_id |
|----|------------|------|----------------------|
| `d-eng` | `c1` | Engineering | NULL |
| `d-ops` | `c1` | Operations | `d-eng` |
| `d-hr` | `c1` | HR | NULL |

### `teams`

| id | department_id | name | lead_company_member_id |
|----|---------------|------|------------------------|
| `t-night` | `d-ops` | Night Shift Team | `m-mgr` |

### `users` (short)

| id | name | email / phone |
|----|------|---------------|
| `u-owner` | Demo Employer | employer@kbdl.dev |
| `u-mgr` | Priya Sharma | … |
| `u-w1` | Ravi Kumar | +919876543211 |
| `u-w2` | Aman Singh | … |

### `company_members` (the important join table)

| id | user_id | company_id | department_id | team_id | role_id | manager_company_member_id |
|----|---------|------------|---------------|---------|---------|---------------------------|
| `m-owner` | `u-owner` | `c1` | `d-hr` | NULL | `r-owner` | NULL |
| `m-mgr` | `u-mgr` | `c1` | `d-eng` | NULL | `r-mgr` | `m-owner` |
| `m-w1` | `u-w1` | `c1` | `d-ops` | `t-night` | `r-site` | `m-mgr` |
| `m-w2` | `u-w2` | `c1` | `d-ops` | `t-night` | `r-emp` | `m-mgr` |

Tree:

```
m-owner (OWNER)
  └── m-mgr (MANAGER)
        ├── m-w1 (SITE_SUPERVISOR)  team Night
        └── m-w2 (EMPLOYEE)         team Night
```

### `shifts`

| id | company_id | department_id | team_id | assigned_company_member_id | original_employee_id | status |
|----|------------|---------------|---------|----------------------------|----------------------|--------|
| `sh1` | `c1` | `d-ops` | `t-night` | `m-w1` | `u-w1` | open |

Notes:

- `company_id` / `department_id` / `team_id` = org scope of the shift  
- `assigned_company_member_id` = which member row is assigned (HRMS)  
- `original_employee_id` = marketplace user (shift-swap); can differ in edge cases  

### `shift_applications`

| id | shift_id | user_id | type | status |
|----|----------|---------|------|--------|
| `a1` | `sh1` | `u-w2` | applied | pending |

---

## 3. Common raw SQL queries

Replace UUIDs / names with real values from seed or your DB.

### 3.1 All members of a company

```sql
SELECT
  cm.id AS member_id,
  u.name,
  u.email,
  u.phone_no,
  cr.code AS role_code,
  cr.name AS role_name,
  d.name AS department,
  t.name AS team
FROM company_members cm
JOIN users u ON u.id = cm.user_id
JOIN company_roles cr ON cr.id = cm.role_id
LEFT JOIN departments d ON d.id = cm.department_id
LEFT JOIN teams t ON t.id = cm.team_id
WHERE cm.company_id = 'c1'   -- or: JOIN companies c ON c.id = cm.company_id AND c.company_name = 'KBDL Corp'
  AND cm.is_active = true
ORDER BY cr.sort_order, u.name;
```

### 3.2 All members in department D (Operations) of company C

```sql
SELECT u.name, cr.code AS role_code, t.name AS team
FROM company_members cm
JOIN users u ON u.id = cm.user_id
JOIN company_roles cr ON cr.id = cm.role_id
LEFT JOIN teams t ON t.id = cm.team_id
JOIN departments d ON d.id = cm.department_id
WHERE cm.company_id = 'c1'
  AND d.name = 'Operations';          -- or: cm.department_id = 'd-ops'
```

### 3.3 Direct reports under a manager

```sql
SELECT
  report.id AS member_id,
  u.name,
  cr.code AS role_code
FROM company_members report
JOIN users u ON u.id = report.user_id
JOIN company_roles cr ON cr.id = report.role_id
WHERE report.manager_company_member_id = 'm-mgr';
```

### 3.4 Full reporting tree under a manager (recursive)

```sql
WITH RECURSIVE tree AS (
  -- start at manager
  SELECT cm.*, 0 AS depth
  FROM company_members cm
  WHERE cm.id = 'm-mgr'

  UNION ALL

  SELECT child.*, tree.depth + 1
  FROM company_members child
  JOIN tree ON child.manager_company_member_id = tree.id
)
SELECT
  tree.id,
  tree.depth,
  u.name,
  cr.code AS role_code
FROM tree
JOIN users u ON u.id = tree.user_id
JOIN company_roles cr ON cr.id = tree.role_id
ORDER BY tree.depth, u.name;
```

### 3.5 Members of company C, department D, who report to manager M  
**(your example)**

```sql
SELECT
  u.name,
  u.phone_no,
  cr.code AS role_code,
  t.name AS team
FROM company_members cm
JOIN users u ON u.id = cm.user_id
JOIN company_roles cr ON cr.id = cm.role_id
LEFT JOIN teams t ON t.id = cm.team_id
WHERE cm.company_id = 'c1'
  AND cm.department_id = 'd-ops'              -- department D
  AND cm.manager_company_member_id = 'm-mgr'  -- under manager M
  AND cm.is_active = true;
```

### 3.6 Same filter, but only people related to shift `sh1`

**A) Assigned member on that shift (HRMS assign)**

```sql
SELECT
  u.name,
  cr.code AS role_code,
  s.id AS shift_id,
  s.status
FROM shifts s
JOIN company_members cm ON cm.id = s.assigned_company_member_id
JOIN users u ON u.id = cm.user_id
JOIN company_roles cr ON cr.id = cm.role_id
WHERE s.id = 'sh1'
  AND cm.company_id = 'c1'
  AND cm.department_id = 'd-ops'
  AND cm.manager_company_member_id = 'm-mgr';
```

**B) Anyone who applied to shift `sh1` and is a company member in dept D under manager M**

```sql
SELECT
  u.name,
  sa.type AS application_type,
  sa.status AS application_status,
  cr.code AS role_code
FROM shift_applications sa
JOIN users u ON u.id = sa.user_id
JOIN company_members cm ON cm.user_id = u.id
JOIN company_roles cr ON cr.id = cm.role_id
WHERE sa.shift_id = 'sh1'
  AND cm.company_id = 'c1'
  AND cm.department_id = 'd-ops'
  AND cm.manager_company_member_id = 'm-mgr';
```

**C) Shift scoped to dept + team, list applicants who also sit in that org slice**

```sql
SELECT
  u.name,
  sa.status,
  d.name AS member_dept,
  t.name AS member_team
FROM shifts s
JOIN shift_applications sa ON sa.shift_id = s.id
JOIN users u ON u.id = sa.user_id
JOIN company_members cm ON cm.user_id = u.id AND cm.company_id = s.company_id
LEFT JOIN departments d ON d.id = cm.department_id
LEFT JOIN teams t ON t.id = cm.team_id
WHERE s.id = 'sh1'
  AND cm.department_id = s.department_id   -- same dept as shift
  AND (s.team_id IS NULL OR cm.team_id = s.team_id)
  AND cm.manager_company_member_id = 'm-mgr';
```

### 3.7 Company owner (employer login identity)

```sql
SELECT
  c.id AS company_id,
  c.company_name,
  u.email,
  u.phone_no,
  cr.code
FROM companies c
JOIN company_members cm ON cm.company_id = c.id
JOIN company_roles cr ON cr.id = cm.role_id AND cr.code = 'OWNER'
JOIN users u ON u.id = cm.user_id
WHERE c.company_name = 'KBDL Corp';
```

### 3.8 All roles for a company (catalog)

```sql
SELECT code, name, is_system, sort_order
FROM company_roles
WHERE company_id = 'c1'
ORDER BY sort_order;
```

### 3.9 Rename a role without touching members

```sql
-- members keep role_id; only display name changes
UPDATE company_roles
SET name = 'Field Supervisor'
WHERE company_id = 'c1' AND code = 'SITE_SUPERVISOR';

-- still the same people:
SELECT u.name, cr.name AS role_name
FROM company_members cm
JOIN users u ON u.id = cm.user_id
JOIN company_roles cr ON cr.id = cm.role_id
WHERE cr.code = 'SITE_SUPERVISOR' AND cm.company_id = 'c1';
```

### 3.10 Department tree for a company

```sql
WITH RECURSIVE dept_tree AS (
  SELECT d.*, 0 AS depth
  FROM departments d
  WHERE d.company_id = 'c1' AND d.parent_department_id IS NULL

  UNION ALL

  SELECT child.*, dept_tree.depth + 1
  FROM departments child
  JOIN dept_tree ON child.parent_department_id = dept_tree.id
)
SELECT depth, id, name, parent_department_id
FROM dept_tree
ORDER BY depth, name;
```

### 3.11 Open shifts for a company (employer dashboard style)

```sql
SELECT
  s.id,
  s.shift_date,
  s.skill_required,
  s.status,
  d.name AS department,
  t.name AS team,
  u.name AS original_worker
FROM shifts s
LEFT JOIN departments d ON d.id = s.department_id
LEFT JOIN teams t ON t.id = s.team_id
JOIN users u ON u.id = s.original_employee_id
WHERE s.company_id = 'c1'
  AND s.status = 'open'
ORDER BY s.shift_start;
```

---

## 4. Mental model (one sentence each)

- **Company** owns everything org-related.  
- **CompanyRole** = label/permissions for that company only.  
- **CompanyMember** = user inside company + role_id + optional dept/team + manager.  
- **Department / Team** = org structure boxes.  
- **Shift** = work slot on a company (optional dept/team).  
- **ShiftApplication** = a **user** wanting that shift.  
- Join path for “people under manager in a dept” always goes through **`company_members`**.

---

## 5. Resolve real UUIDs from seed

```sql
-- company
SELECT id, company_name FROM companies WHERE company_name = 'KBDL Corp';

-- department
SELECT id, name FROM departments
WHERE company_id = '<company_uuid>' AND name = 'Operations';

-- manager member (by user name)
SELECT cm.id, u.name, cr.code
FROM company_members cm
JOIN users u ON u.id = cm.user_id
JOIN company_roles cr ON cr.id = cm.role_id
WHERE cm.company_id = '<company_uuid>' AND u.name = 'Priya Sharma';

-- a shift
SELECT id, skill_required, status FROM shifts
WHERE company_id = '<company_uuid>'
LIMIT 5;
```

users
   ↓
Actual people

company_members
   ↓
Their employment record in a company

company_roles
   ↓
What job title they have

departments
   ↓
Which department they work in

teams
   ↓
Which team inside that department

manager_company_member_id
   ↓
Who they report to

shifts
   ↓
Work assigned to employees

shift_applications
   ↓
Who applied for that work