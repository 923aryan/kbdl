/*
  Warnings:

  - The values [organization] on the enum `user_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "user_type_new" AS ENUM ('employer', 'user');
ALTER TABLE "shifts" ALTER COLUMN "created_by" TYPE "user_type_new" USING ("created_by"::text::"user_type_new");
ALTER TABLE "jobs" ALTER COLUMN "job_poster_type" TYPE "user_type_new" USING ("job_poster_type"::text::"user_type_new");
ALTER TABLE "subscriptions" ALTER COLUMN "subscription_user_type" TYPE "user_type_new" USING ("subscription_user_type"::text::"user_type_new");
ALTER TABLE "transactions" ALTER COLUMN "transaction_user_type" TYPE "user_type_new" USING ("transaction_user_type"::text::"user_type_new");
ALTER TABLE "orders" ALTER COLUMN "order_user_type" TYPE "user_type_new" USING ("order_user_type"::text::"user_type_new");
ALTER TYPE "user_type" RENAME TO "user_type_old";
ALTER TYPE "user_type_new" RENAME TO "user_type";
DROP TYPE "public"."user_type_old";
COMMIT;
