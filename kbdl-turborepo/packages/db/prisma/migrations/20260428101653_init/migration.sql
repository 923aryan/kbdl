-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "shift_status" AS ENUM ('open', 'matched', 'approved', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "salary_type" AS ENUM ('hourly', 'daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('open', 'closed', 'paused');

-- CreateEnum
CREATE TYPE "job_application_status" AS ENUM ('applied', 'shortlisted', 'rejected', 'hired');

-- CreateEnum
CREATE TYPE "target_audience" AS ENUM ('worker', 'employer', 'individual', 'contractor');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- CreateEnum
CREATE TYPE "employment_status" AS ENUM ('active', 'inactive', 'terminated', 'resigned');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('payment', 'refund', 'payout');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "payment_mode" AS ENUM ('cash', 'upi');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "karigari_id" VARCHAR,
    "phone_no" VARCHAR NOT NULL,
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

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "original_employee_id" UUID NOT NULL,
    "replacement_employee_id" UUID,
    "employer_id" UUID NOT NULL,
    "shift_date" TIMESTAMPTZ NOT NULL,
    "shift_start" TIMESTAMPTZ NOT NULL,
    "shift_end" TIMESTAMPTZ NOT NULL,
    "skill_required" VARCHAR NOT NULL,
    "status" "shift_status" NOT NULL,
    "organization_approved" BOOLEAN NOT NULL DEFAULT false,
    "no_show_reported" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employers" (
    "id" UUID NOT NULL,
    "company_name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "company_address" VARCHAR,
    "phone_no" VARCHAR NOT NULL,
    "subscription_tier" VARCHAR,
    "gst_number" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "title" VARCHAR NOT NULL,
    "skill_required" VARCHAR NOT NULL,
    "salary_amount" DECIMAL(10,2) NOT NULL,
    "salary_type" "salary_type" NOT NULL,
    "shift_start" TIMESTAMPTZ NOT NULL,
    "shift_end" TIMESTAMPTZ NOT NULL,
    "address" TEXT,
    "location" geography(Point, 4326),
    "seats_available" INTEGER,
    "seats_filled" INTEGER,
    "status" "job_status" NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" "job_application_status" NOT NULL,
    "applied_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "shift_id" UUID,
    "job_id" UUID,
    "score" INTEGER NOT NULL,
    "flagged_issue" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "target" "target_audience" NOT NULL,
    "price" DECIMAL(10,2),
    "billing_cycle" VARCHAR,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_subscriptions" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "subscription_status" NOT NULL,
    "starts_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employee_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "role" VARCHAR NOT NULL,
    "password_hash" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "phone_no" VARCHAR NOT NULL,
    "type" VARCHAR,
    "default_address" VARCHAR,
    "location" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_employments" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "employee_no" VARCHAR,
    "employment_status" "employment_status" NOT NULL,
    "joined_at" TIMESTAMPTZ,
    "left_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employee_employments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "employee_id" UUID,
    "subscription_id" UUID,
    "order_id" UUID,
    "type" "transaction_type" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "transaction_status" NOT NULL,
    "payment_mode" "payment_mode" NOT NULL,
    "razorpay_payment_id" VARCHAR,
    "razorpay_order_id" VARCHAR,
    "razorpay_signature" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "employer_id" UUID,
    "employee_id" UUID,
    "order_date" TIMESTAMPTZ NOT NULL,
    "total_price" DECIMAL(10,2),
    "payment_status" "payment_status" NOT NULL,
    "shipping_address" VARCHAR,
    "address_id" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_phone_no_key" ON "employees"("phone_no");

-- CreateIndex
CREATE INDEX "shifts_original_employee_id_idx" ON "shifts"("original_employee_id");

-- CreateIndex
CREATE INDEX "shifts_replacement_employee_id_idx" ON "shifts"("replacement_employee_id");

-- CreateIndex
CREATE INDEX "shifts_employer_id_idx" ON "shifts"("employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "employers_email_key" ON "employers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employers_phone_no_key" ON "employers"("phone_no");

-- CreateIndex
CREATE INDEX "jobs_employer_id_idx" ON "jobs"("employer_id");

-- CreateIndex
CREATE INDEX "job_applications_job_id_idx" ON "job_applications"("job_id");

-- CreateIndex
CREATE INDEX "job_applications_employee_id_idx" ON "job_applications"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_id_employee_id_key" ON "job_applications"("job_id", "employee_id");

-- CreateIndex
CREATE INDEX "ratings_employee_id_idx" ON "ratings"("employee_id");

-- CreateIndex
CREATE INDEX "ratings_employer_id_idx" ON "ratings"("employer_id");

-- CreateIndex
CREATE INDEX "ratings_shift_id_idx" ON "ratings"("shift_id");

-- CreateIndex
CREATE INDEX "ratings_job_id_idx" ON "ratings"("job_id");

-- CreateIndex
CREATE INDEX "employee_subscriptions_employee_id_idx" ON "employee_subscriptions"("employee_id");

-- CreateIndex
CREATE INDEX "employee_subscriptions_plan_id_idx" ON "employee_subscriptions"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_no_key" ON "customers"("phone_no");

-- CreateIndex
CREATE INDEX "employee_employments_employer_id_idx" ON "employee_employments"("employer_id");

-- CreateIndex
CREATE INDEX "employee_employments_employee_id_idx" ON "employee_employments"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_employments_employer_id_employee_id_key" ON "employee_employments"("employer_id", "employee_id");

-- CreateIndex
CREATE INDEX "transactions_employer_id_idx" ON "transactions"("employer_id");

-- CreateIndex
CREATE INDEX "transactions_employee_id_idx" ON "transactions"("employee_id");

-- CreateIndex
CREATE INDEX "transactions_subscription_id_idx" ON "transactions"("subscription_id");

-- CreateIndex
CREATE INDEX "transactions_order_id_idx" ON "transactions"("order_id");

-- CreateIndex
CREATE INDEX "orders_employer_id_idx" ON "orders"("employer_id");

-- CreateIndex
CREATE INDEX "orders_employee_id_idx" ON "orders"("employee_id");

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_original_employee_id_fkey" FOREIGN KEY ("original_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_replacement_employee_id_fkey" FOREIGN KEY ("replacement_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_subscriptions" ADD CONSTRAINT "employee_subscriptions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_subscriptions" ADD CONSTRAINT "employee_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employments" ADD CONSTRAINT "employee_employments_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employments" ADD CONSTRAINT "employee_employments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "employee_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
