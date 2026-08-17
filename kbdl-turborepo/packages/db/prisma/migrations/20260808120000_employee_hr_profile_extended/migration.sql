-- Extended HR profile fields + company-scoped address table (present / permanent)

CREATE TYPE "hr_address_type" AS ENUM ('present', 'permanent');
CREATE TYPE "marital_status" AS ENUM ('unmarried', 'married', 'divorced', 'widowed');

ALTER TABLE "employee_hr_profiles"
  ADD COLUMN "alternate_phone" VARCHAR,
  ADD COLUMN "marital_status" "marital_status",
  ADD COLUMN "father_name" VARCHAR,
  ADD COLUMN "mother_name" VARCHAR,
  ADD COLUMN "nationality" VARCHAR DEFAULT 'Indian',
  ADD COLUMN "religion" VARCHAR,
  ADD COLUMN "languages_known" VARCHAR,
  ADD COLUMN "probation_period_months" INTEGER,
  ADD COLUMN "notice_period_days" INTEGER,
  ADD COLUMN "weekly_off" VARCHAR,
  ADD COLUMN "confirmation_date" DATE,
  ADD COLUMN "working_hours" VARCHAR,
  ADD COLUMN "voter_id" VARCHAR,
  ADD COLUMN "uan_number" VARCHAR,
  ADD COLUMN "esi_number" VARCHAR,
  ADD COLUMN "pf_number" VARCHAR;

CREATE TABLE "employee_hr_addresses" (
  "id" UUID NOT NULL,
  "hr_profile_id" UUID NOT NULL,
  "type" "hr_address_type" NOT NULL,
  "line1" VARCHAR,
  "line2" VARCHAR,
  "city" VARCHAR,
  "state" VARCHAR,
  "pincode" VARCHAR(10),
  "country" VARCHAR(2) NOT NULL DEFAULT 'IN',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "employee_hr_addresses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_hr_addresses_hr_profile_id_type_key"
  ON "employee_hr_addresses"("hr_profile_id", "type");

CREATE INDEX "employee_hr_addresses_hr_profile_id_idx"
  ON "employee_hr_addresses"("hr_profile_id");

ALTER TABLE "employee_hr_addresses"
  ADD CONSTRAINT "employee_hr_addresses_hr_profile_id_fkey"
  FOREIGN KEY ("hr_profile_id") REFERENCES "employee_hr_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill present address from legacy free-text column
INSERT INTO "employee_hr_addresses" (
  "id", "hr_profile_id", "type", "line1", "country", "created_at", "updated_at"
)
SELECT
  gen_random_uuid(),
  "id",
  'present'::"hr_address_type",
  "address",
  'IN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "employee_hr_profiles"
WHERE "address" IS NOT NULL AND TRIM("address") <> '';
