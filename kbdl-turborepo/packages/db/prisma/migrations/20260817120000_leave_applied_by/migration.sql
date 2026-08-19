-- AlterTable
CREATE TYPE "leave_applied_by_kind" AS ENUM ('hr', 'manager');

ALTER TABLE "leave_requests"
  ADD COLUMN IF NOT EXISTS "applied_by_kind" "leave_applied_by_kind",
  ADD COLUMN IF NOT EXISTS "applied_by_company_member_id" UUID,
  ADD COLUMN IF NOT EXISTS "decided_by_company_member_id" UUID;

UPDATE "leave_requests"
SET "applied_by_kind" = CASE
  WHEN "status" = 'pending' THEN 'manager'::"leave_applied_by_kind"
  ELSE 'hr'::"leave_applied_by_kind"
END
WHERE "applied_by_kind" IS NULL;

ALTER TABLE "leave_requests"
  ALTER COLUMN "applied_by_kind" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "leave_requests_applied_by_company_member_id_idx"
  ON "leave_requests"("applied_by_company_member_id");

ALTER TABLE "leave_requests"
  ADD CONSTRAINT "leave_requests_applied_by_company_member_id_fkey"
  FOREIGN KEY ("applied_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leave_requests"
  ADD CONSTRAINT "leave_requests_decided_by_company_member_id_fkey"
  FOREIGN KEY ("decided_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
