/*
  Warnings:

  - You are about to drop the column `employee_id` on the `job_applications` table. All the data in the column will be lost.
  - You are about to drop the column `shift_end` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `shift_start` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `employee_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `employee_id` on the `ratings` table. All the data in the column will be lost.
  - You are about to drop the column `employee_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employees` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[job_id,user_id]` on the table `job_applications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `job_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_end_time` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_poster_type` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_start_time` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_user_type` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `ratings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_user_type` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('organization', 'user');

-- DropForeignKey
ALTER TABLE "employee_employments" DROP CONSTRAINT "employee_employments_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_subscriptions" DROP CONSTRAINT "employee_subscriptions_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_subscriptions" DROP CONSTRAINT "employee_subscriptions_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "job_applications" DROP CONSTRAINT "job_applications_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_original_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_replacement_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_subscription_id_fkey";

-- DropIndex
DROP INDEX "job_applications_employee_id_idx";

-- DropIndex
DROP INDEX "job_applications_job_id_employee_id_key";

-- DropIndex
DROP INDEX "orders_employee_id_idx";

-- DropIndex
DROP INDEX "ratings_employee_id_idx";

-- DropIndex
DROP INDEX "transactions_employee_id_idx";

-- AlterTable
ALTER TABLE "job_applications" DROP COLUMN "employee_id",
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "shift_end",
DROP COLUMN "shift_start",
ADD COLUMN     "job_end_time" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "job_poster_type" "user_type" NOT NULL,
ADD COLUMN     "job_start_time" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "user_id" UUID,
ALTER COLUMN "employer_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "employee_id",
ADD COLUMN     "order_user_type" "user_type" NOT NULL,
ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "ratings" DROP COLUMN "employee_id",
ADD COLUMN     "user_employer_id" UUID,
ADD COLUMN     "user_id" UUID NOT NULL,
ALTER COLUMN "employer_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "employee_id",
ADD COLUMN     "transaction_user_type" "user_type" NOT NULL,
ADD COLUMN     "user_id" UUID,
ALTER COLUMN "employer_id" DROP NOT NULL;

-- DropTable
DROP TABLE "customers";

-- DropTable
DROP TABLE "employee_subscriptions";

-- DropTable
DROP TABLE "employees";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "karigari_id" VARCHAR,
    "phone_no" VARCHAR NOT NULL,
    "default_address" VARCHAR,
    "skills" TEXT[],
    "experience" INTEGER,
    "city" VARCHAR,
    "area" VARCHAR,
    "location" geography(Point, 4326),
    "rating_avg" DECIMAL(3,2),
    "rating_count" INTEGER,
    "verification_level" INTEGER,
    "extra_shift" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "employer_id" UUID,
    "plan_id" UUID NOT NULL,
    "subscription_user_type" "user_type" NOT NULL,
    "status" "subscription_status" NOT NULL,
    "starts_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_no_key" ON "users"("phone_no");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "job_applications_user_id_idx" ON "job_applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_id_user_id_key" ON "job_applications"("job_id", "user_id");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "ratings_user_id_idx" ON "ratings"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_original_employee_id_fkey" FOREIGN KEY ("original_employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_replacement_employee_id_fkey" FOREIGN KEY ("replacement_employee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_employer_id_fkey" FOREIGN KEY ("user_employer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employments" ADD CONSTRAINT "employee_employments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
