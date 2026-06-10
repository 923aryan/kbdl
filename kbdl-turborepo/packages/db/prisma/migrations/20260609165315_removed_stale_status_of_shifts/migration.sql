/*
  Warnings:

  - The values [matched,pending,rejected] on the enum `shift_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "shift_status_new" AS ENUM ('open', 'approved', 'completed', 'cancelled');
ALTER TABLE "shifts" ALTER COLUMN "status" TYPE "shift_status_new" USING ("status"::text::"shift_status_new");
ALTER TYPE "shift_status" RENAME TO "shift_status_old";
ALTER TYPE "shift_status_new" RENAME TO "shift_status";
DROP TYPE "public"."shift_status_old";
COMMIT;
