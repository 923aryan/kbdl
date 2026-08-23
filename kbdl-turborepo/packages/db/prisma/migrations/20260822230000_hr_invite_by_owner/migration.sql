ALTER TABLE "hr_invites" ALTER COLUMN "invited_by_admin_id" DROP NOT NULL;

ALTER TABLE "hr_invites" ADD COLUMN IF NOT EXISTS "invited_by_user_id" UUID;

CREATE INDEX IF NOT EXISTS "hr_invites_invited_by_user_id_idx" ON "hr_invites"("invited_by_user_id");

ALTER TABLE "hr_invites" DROP CONSTRAINT IF EXISTS "hr_invites_invited_by_user_id_fkey";
ALTER TABLE "hr_invites"
  ADD CONSTRAINT "hr_invites_invited_by_user_id_fkey"
  FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
