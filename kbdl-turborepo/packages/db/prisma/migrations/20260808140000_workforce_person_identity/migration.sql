-- Option A: HR workforce identity separate from app users

CREATE TABLE "workforce_persons" (
  "id" UUID NOT NULL,
  "phone_no" VARCHAR NOT NULL,
  "karigari_id" VARCHAR,
  "linked_user_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "workforce_persons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workforce_persons_phone_no_key" ON "workforce_persons"("phone_no");
CREATE UNIQUE INDEX "workforce_persons_karigari_id_key" ON "workforce_persons"("karigari_id");
CREATE UNIQUE INDEX "workforce_persons_linked_user_id_key" ON "workforce_persons"("linked_user_id");

ALTER TABLE "workforce_persons"
  ADD CONSTRAINT "workforce_persons_linked_user_id_fkey"
  FOREIGN KEY ("linked_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill one workforce person per user who has employment history
INSERT INTO "workforce_persons" ("id", "phone_no", "karigari_id", "linked_user_id", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  u."phone_no",
  u."karigari_id",
  u."id",
  u."created_at",
  u."updated_at"
FROM "users" u
WHERE EXISTS (
  SELECT 1 FROM "employee_employments" ee WHERE ee."employee_id" = u."id"
);

ALTER TABLE "employee_employments" ADD COLUMN "workforce_person_id" UUID;

UPDATE "employee_employments" ee
SET "workforce_person_id" = wp."id"
FROM "workforce_persons" wp
WHERE wp."linked_user_id" = ee."employee_id";

-- Safety: any remaining rows get a workforce person from the linked user row
INSERT INTO "workforce_persons" ("id", "phone_no", "karigari_id", "linked_user_id", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  u."phone_no",
  u."karigari_id",
  u."id",
  u."created_at",
  u."updated_at"
FROM "users" u
INNER JOIN "employee_employments" ee ON ee."employee_id" = u."id"
WHERE ee."workforce_person_id" IS NULL
ON CONFLICT ("phone_no") DO NOTHING;

UPDATE "employee_employments" ee
SET "workforce_person_id" = wp."id"
FROM "workforce_persons" wp
WHERE ee."workforce_person_id" IS NULL
  AND wp."linked_user_id" = ee."employee_id";

ALTER TABLE "employee_employments" ALTER COLUMN "workforce_person_id" SET NOT NULL;

ALTER TABLE "employee_employments" DROP CONSTRAINT IF EXISTS "employee_employments_employee_id_fkey";
DROP INDEX IF EXISTS "employee_employments_one_active_per_company_user_idx";
DROP INDEX IF EXISTS "employee_employments_company_id_employee_id_idx";
ALTER TABLE "employee_employments" DROP COLUMN "employee_id";

ALTER TABLE "employee_employments"
  ADD CONSTRAINT "employee_employments_workforce_person_id_fkey"
  FOREIGN KEY ("workforce_person_id") REFERENCES "workforce_persons"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "employee_employments_company_id_workforce_person_id_idx"
  ON "employee_employments"("company_id", "workforce_person_id");

CREATE UNIQUE INDEX "employee_employments_one_active_per_company_person_idx"
  ON "employee_employments" ("company_id", "workforce_person_id")
  WHERE "is_active" = true;

-- Worker org rows may exist without app user until OTP link
ALTER TABLE "company_members" ALTER COLUMN "user_id" DROP NOT NULL;

UPDATE "company_members" cm
SET "user_id" = NULL
FROM "employee_employments" ee
INNER JOIN "workforce_persons" wp ON wp."id" = ee."workforce_person_id"
WHERE cm."employment_id" = ee."id"
  AND wp."linked_user_id" IS NULL;
