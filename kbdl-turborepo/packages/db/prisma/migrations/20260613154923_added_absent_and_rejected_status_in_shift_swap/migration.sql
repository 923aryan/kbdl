/*
  Warnings:

  - You are about to drop the column `job_poster_type` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `salary_amount` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `seats_filled` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `skill_required` on the `jobs` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `jobs` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(255)`.
  - Added the required column `description` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employment_type` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `work_type` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "employment_type" AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance');

-- CreateEnum
CREATE TYPE "job_work_type" AS ENUM ('onsite', 'remote', 'hybrid');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "job_application_status" ADD VALUE 'under_review';
ALTER TYPE "job_application_status" ADD VALUE 'interview_scheduled';
ALTER TYPE "job_application_status" ADD VALUE 'selected';
ALTER TYPE "job_application_status" ADD VALUE 'withdrawn';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "job_status" ADD VALUE 'draft';
ALTER TYPE "job_status" ADD VALUE 'expired';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "shift_status" ADD VALUE 'absent';
ALTER TYPE "shift_status" ADD VALUE 'rejected';

-- DropForeignKey
ALTER TABLE "job_applications" DROP CONSTRAINT "job_applications_job_id_fkey";

-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "cover_letter" TEXT,
ADD COLUMN     "employer_notes" TEXT,
ADD COLUMN     "hired_at" TIMESTAMPTZ,
ADD COLUMN     "interview_at" TIMESTAMPTZ,
ADD COLUMN     "rejected_at" TIMESTAMPTZ,
ADD COLUMN     "reviewed_at" TIMESTAMPTZ,
ADD COLUMN     "shortlisted_at" TIMESTAMPTZ,
ADD COLUMN     "withdrawn_at" TIMESTAMPTZ,
ALTER COLUMN "status" SET DEFAULT 'applied',
ALTER COLUMN "applied_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "job_poster_type",
DROP COLUMN "salary_amount",
DROP COLUMN "seats_filled",
DROP COLUMN "skill_required",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "employment_type" "employment_type" NOT NULL,
ADD COLUMN     "is_negotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "salary_max" DECIMAL(10,2),
ADD COLUMN     "salary_min" DECIMAL(10,2),
ADD COLUMN     "work_type" "job_work_type" NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "status" SET DEFAULT 'open',
ALTER COLUMN "job_end_time" DROP NOT NULL,
ALTER COLUMN "job_start_time" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");

-- CreateIndex
CREATE INDEX "job_applications_job_id_status_idx" ON "job_applications"("job_id", "status");

-- CreateIndex
CREATE INDEX "jobs_user_id_idx" ON "jobs"("user_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_expires_at_idx" ON "jobs"("expires_at");

-- CreateIndex
CREATE INDEX "jobs_job_start_time_idx" ON "jobs"("job_start_time");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
