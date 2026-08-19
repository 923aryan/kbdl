-- Company work sites (onboard branch) for geo attendance
CREATE TABLE IF NOT EXISTS "company_branches" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "location" geography(Point, 4326),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_branches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_branches_company_id_name_key" ON "company_branches"("company_id", "name");
CREATE INDEX IF NOT EXISTS "company_branches_company_id_idx" ON "company_branches"("company_id");

DO $$
BEGIN
  ALTER TABLE "company_branches"
    ADD CONSTRAINT "company_branches_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "employee_hr_profiles" ADD COLUMN IF NOT EXISTS "branch_id" UUID;
CREATE INDEX IF NOT EXISTS "employee_hr_profiles_branch_id_idx" ON "employee_hr_profiles"("branch_id");

DO $$
BEGIN
  ALTER TABLE "employee_hr_profiles"
    ADD CONSTRAINT "employee_hr_profiles_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "company_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backfill unique branches from onboarded names
INSERT INTO "company_branches" ("id", "company_id", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), s."company_id", s."name", NOW(), NOW()
FROM (
  SELECT DISTINCT ON (ee."company_id", TRIM(hp."branch_location"))
    ee."company_id",
    TRIM(hp."branch_location") AS "name"
  FROM "employee_hr_profiles" hp
  INNER JOIN "employee_employments" ee ON ee."id" = hp."employment_id"
  WHERE hp."branch_location" IS NOT NULL
    AND TRIM(hp."branch_location") <> ''
  ORDER BY ee."company_id", TRIM(hp."branch_location")
) s
WHERE NOT EXISTS (
  SELECT 1
  FROM "company_branches" cb
  WHERE cb."company_id" = s."company_id"
    AND cb."name" = s."name"
);

UPDATE "employee_hr_profiles" AS hp
SET "branch_id" = cb."id"
FROM "employee_employments" AS ee, "company_branches" AS cb
WHERE ee."id" = hp."employment_id"
  AND cb."company_id" = ee."company_id"
  AND cb."name" = TRIM(hp."branch_location")
  AND hp."branch_location" IS NOT NULL
  AND TRIM(hp."branch_location") <> '';

-- Until per-branch coordinates are set, copy company HQ onto branch points
UPDATE "company_branches" cb
SET "location" = c."company_location"
FROM "companies" c
WHERE c."id" = cb."company_id"
  AND cb."location" IS NULL
  AND c."company_location" IS NOT NULL;

ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "punch_in_lat" DOUBLE PRECISION;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "punch_in_lng" DOUBLE PRECISION;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "punch_in_accuracy" DOUBLE PRECISION;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "punch_out_lat" DOUBLE PRECISION;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "punch_out_lng" DOUBLE PRECISION;
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "punch_out_accuracy" DOUBLE PRECISION;
