/*
  Warnings:

  - You are about to drop the column `name` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `preferences` on the `otp_verifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone_no,role]` on the table `otp_verifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,role]` on the table `otp_verifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role` to the `otp_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "otp_verifications_email_key";

-- DropIndex
DROP INDEX "otp_verifications_phone_no_key";

-- AlterTable
ALTER TABLE "otp_verifications" DROP COLUMN "name",
DROP COLUMN "preferences",
ADD COLUMN     "payload" JSONB DEFAULT '{}',
ADD COLUMN     "role" VARCHAR NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "extra_shift" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "otp_verifications_phone_no_role_key" ON "otp_verifications"("phone_no", "role");

-- CreateIndex
CREATE UNIQUE INDEX "otp_verifications_email_role_key" ON "otp_verifications"("email", "role");
