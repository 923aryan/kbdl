-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refresh_token" VARCHAR;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token" VARCHAR;

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL,
    "phone_no" VARCHAR,
    "email" VARCHAR,
    "otp" VARCHAR NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "otp_verifications_phone_no_key" ON "otp_verifications"("phone_no");

-- CreateIndex
CREATE UNIQUE INDEX "otp_verifications_email_key" ON "otp_verifications"("email");
