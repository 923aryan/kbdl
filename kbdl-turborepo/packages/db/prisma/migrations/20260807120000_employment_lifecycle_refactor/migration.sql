-- Employment lifecycle refactor: is_active + separation_reason, employment-linked company_members

CREATE TYPE "separation_reason" AS ENUM ('terminated', 'resigned', 'absconded', 'inactive');

ALTER TABLE "employee_employments"
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "separation_reason" "separation_reason";

UPDATE "employee_employments"
SET
  "is_active" = CASE
    WHEN "employment_status"::text IN ('active', 'pending') THEN true
    ELSE false
  END,
  "separation_reason" = CASE
    WHEN "employment_status"::text = 'terminated' THEN 'terminated'::"separation_reason"
    WHEN "employment_status"::text = 'resigned' THEN 'resigned'::"separation_reason"
    WHEN "employment_status"::text = 'inactive' THEN 'inactive'::"separation_reason"
    ELSE NULL
  END;

ALTER TABLE "employee_employments" DROP COLUMN "employment_status";

DROP TYPE IF EXISTS "employment_status";

CREATE UNIQUE INDEX "employee_employments_one_active_per_company_user_idx"
  ON "employee_employments" ("company_id", "employee_id")
  WHERE "is_active" = true;

CREATE INDEX "employee_employments_is_active_idx" ON "employee_employments"("is_active");

-- company_members: link worker rows to employment stint
ALTER TABLE "company_members" ADD COLUMN "employment_id" UUID;

ALTER TABLE "company_members"
  ADD CONSTRAINT "company_members_employment_id_fkey"
  FOREIGN KEY ("employment_id") REFERENCES "employee_employments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "company_members_employment_id_key" ON "company_members"("employment_id");

DROP INDEX IF EXISTS "company_members_user_id_key";
DROP INDEX IF EXISTS "company_members_company_id_user_id_key";

CREATE INDEX "company_members_company_id_user_id_idx" ON "company_members"("company_id", "user_id");
CREATE INDEX "company_members_employment_id_idx" ON "company_members"("employment_id");

-- Backfill employment_id on worker members (most recent active employment per user+company)
UPDATE "company_members" cm
SET "employment_id" = sub.id
FROM (
  SELECT DISTINCT ON (ee."company_id", ee."employee_id")
    ee."id",
    ee."company_id",
    ee."employee_id"
  FROM "employee_employments" ee
  ORDER BY ee."company_id", ee."employee_id", ee."is_active" DESC, ee."joined_at" DESC
) sub
WHERE cm."user_id" = sub."employee_id"
  AND cm."company_id" = sub."company_id"
  AND cm."employment_id" IS NULL
  AND cm."platform_type" = 'EMPLOYEE';

-- HR profile: per-stint department snapshot
ALTER TABLE "employee_hr_profiles" ADD COLUMN "department_id" UUID;

ALTER TABLE "employee_hr_profiles"
  ADD CONSTRAINT "employee_hr_profiles_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "employee_hr_profiles_department_id_idx" ON "employee_hr_profiles"("department_id");

UPDATE "employee_hr_profiles" hp
SET "department_id" = cm."department_id"
FROM "employee_employments" ee
JOIN "company_members" cm
  ON cm."employment_id" = ee."id"
WHERE hp."employment_id" = ee."id"
  AND hp."department_id" IS NULL
  AND cm."department_id" IS NOT NULL;

-- Fallback: members not yet linked — match by user+company
UPDATE "employee_hr_profiles" hp
SET "department_id" = cm."department_id"
FROM "employee_employments" ee
JOIN "company_members" cm
  ON cm."user_id" = ee."employee_id"
 AND cm."company_id" = ee."company_id"
WHERE hp."employment_id" = ee."id"
  AND hp."department_id" IS NULL
  AND cm."department_id" IS NOT NULL;
