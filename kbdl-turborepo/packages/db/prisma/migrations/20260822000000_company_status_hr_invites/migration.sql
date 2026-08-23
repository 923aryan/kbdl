-- CreateEnum
CREATE TYPE "company_status" AS ENUM ('onboarding', 'pending_review', 'active', 'suspended', 'rejected');

-- CreateEnum
CREATE TYPE "hr_invite_status" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- AlterTable
ALTER TABLE "companies"
ADD COLUMN "status" "company_status" NOT NULL DEFAULT 'onboarding';

UPDATE "companies"
SET "status" = 'active'
WHERE "is_verified" = true;

UPDATE "companies"
SET "status" = 'pending_review'
WHERE "is_verified" = false;

CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateTable
CREATE TABLE "hr_invites" (
    "id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "phone_no" VARCHAR NOT NULL,
    "full_name" VARCHAR NOT NULL,
    "status" "hr_invite_status" NOT NULL DEFAULT 'pending',
    "invited_by_admin_id" UUID NOT NULL,
    "user_id" UUID,
    "company_id" UUID,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "hr_invites_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hr_invites_email_idx" ON "hr_invites"("email");
CREATE INDEX "hr_invites_status_idx" ON "hr_invites"("status");
CREATE INDEX "hr_invites_invited_by_admin_id_idx" ON "hr_invites"("invited_by_admin_id");

ALTER TABLE "hr_invites" ADD CONSTRAINT "hr_invites_invited_by_admin_id_fkey" FOREIGN KEY ("invited_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_invites" ADD CONSTRAINT "hr_invites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_invites" ADD CONSTRAINT "hr_invites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
