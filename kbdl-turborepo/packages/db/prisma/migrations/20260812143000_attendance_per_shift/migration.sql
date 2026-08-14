-- Option B: one attendance row per employee per date per shift
ALTER TABLE "attendances" DROP CONSTRAINT IF EXISTS "attendances_company_member_id_date_key";

-- Ensure work_shift_id is set before NOT NULL (seed rows already have shift)
UPDATE "attendances" a
SET "work_shift_id" = es."work_shift_id"
FROM "employee_shifts" es
WHERE a."work_shift_id" IS NULL
  AND es."company_member_id" = a."company_member_id"
  AND es."effective_from" <= a."date"
  AND (es."effective_to" IS NULL OR es."effective_to" >= a."date");

DELETE FROM "attendances" WHERE "work_shift_id" IS NULL;

ALTER TABLE "attendances" ALTER COLUMN "work_shift_id" SET NOT NULL;

CREATE UNIQUE INDEX "attendances_company_member_id_date_work_shift_id_key"
  ON "attendances" ("company_member_id", "date", "work_shift_id");
