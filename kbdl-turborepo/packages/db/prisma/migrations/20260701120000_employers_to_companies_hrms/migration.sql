-- Catch-up: Employer → Company + HRMS tables that were previously applied via `db push`.
-- Required before 20260806120000_allow_multiple_employments_per_company (expects company_id).
-- If this database already has `companies` (db push + baseline), mark applied instead of running:
--   node ./scripts/prisma-cli.mjs migrate resolve --applied 20260701120000_employers_to_companies_hrms

-- CreateEnum (idempotent — partial failed runs may leave types behind)
DO $$ BEGIN CREATE TYPE "platform_type" AS ENUM ('EMPLOYEE', 'EMPLOYER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "onboarding_stage" AS ENUM ('draft', 'onboard', 'probation'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "attendance_status" AS ENUM ('present', 'absent', 'half_day', 'leave', 'holiday', 'week_off', 'on_duty'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "attendance_source" AS ENUM ('hr_manual', 'device', 'app', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterEnum (idempotent)
DO $$ BEGIN
  ALTER TYPE "target_audience" RENAME VALUE 'employer' TO 'company';
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN invalid_parameter_value THEN NULL;
END $$;

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT IF EXISTS "shifts_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT IF EXISTS "ratings_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT IF EXISTS "ratings_user_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT IF EXISTS "ratings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "employee_employments" DROP CONSTRAINT IF EXISTS "employee_employments_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_employer_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_employer_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "shifts_employer_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "jobs_employer_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "jobs_user_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "ratings_user_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "ratings_employer_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "ratings_shift_id_user_id_employer_id_key";

-- DropIndex
DROP INDEX IF EXISTS "ratings_shift_id_user_id_user_employer_id_key";

-- DropIndex
DROP INDEX IF EXISTS "employee_employments_employer_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "employee_employments_employer_id_employee_id_key";

-- DropIndex
DROP INDEX IF EXISTS "transactions_employer_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "orders_employer_id_idx";

-- employers → companies (keep ids so renamed FKs still match)
ALTER TABLE "employers" RENAME TO "companies";
ALTER TABLE "companies" RENAME CONSTRAINT "employers_pkey" TO "companies_pkey";
DROP INDEX IF EXISTS "employers_email_key";
DROP INDEX IF EXISTS "employers_phone_no_key";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "email";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "phone_no";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "subscription_tier";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "refresh_token";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "role";
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "pan" VARCHAR;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "state" VARCHAR;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "epf_registration_no" VARCHAR;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "esic_code" VARCHAR;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "employer_id",
DROP COLUMN "role",
ADD COLUMN     "email" VARCHAR,
ADD COLUMN     "password_hash" VARCHAR;

-- AlterTable
ALTER TABLE "shifts" RENAME COLUMN "employer_id" TO "company_id";
ALTER TABLE "shifts"
ADD COLUMN     "assigned_company_member_id" UUID,
ADD COLUMN     "created_by_company_member_id" UUID,
ADD COLUMN     "department_id" UUID,
ADD COLUMN     "team_id" UUID;
ALTER TABLE "shifts" ALTER COLUMN "created_by" TYPE "platform_type" USING (
  CASE
    WHEN "created_by"::text IN ('employer', 'EMPLOYER') THEN 'EMPLOYER'::"platform_type"
    ELSE 'EMPLOYEE'::"platform_type"
  END
);

-- AlterTable
ALTER TABLE "jobs" RENAME COLUMN "employer_id" TO "company_id";
ALTER TABLE "jobs" ALTER COLUMN "company_id" SET NOT NULL;
ALTER TABLE "jobs" DROP COLUMN "user_id",
ADD COLUMN     "created_by_company_member_id" UUID,
ADD COLUMN     "department_id" UUID,
ADD COLUMN     "team_id" UUID;

-- AlterTable
ALTER TABLE "ratings" DROP COLUMN "employer_id",
DROP COLUMN "user_employer_id",
DROP COLUMN "user_id",
ADD COLUMN     "company_id" UUID,
ADD COLUMN     "from_company_member_id" UUID,
ADD COLUMN     "from_user_id" UUID NOT NULL,
ADD COLUMN     "to_company_member_id" UUID,
ADD COLUMN     "to_user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" RENAME COLUMN "employer_id" TO "company_id";
ALTER TABLE "subscriptions" DROP COLUMN "subscription_user_type";
ALTER TABLE "subscriptions" ADD COLUMN "subscription_platform_type" "platform_type";
UPDATE "subscriptions" SET "subscription_platform_type" = 'EMPLOYER' WHERE "subscription_platform_type" IS NULL AND "company_id" IS NOT NULL;
UPDATE "subscriptions" SET "subscription_platform_type" = 'EMPLOYEE' WHERE "subscription_platform_type" IS NULL;
ALTER TABLE "subscriptions" ALTER COLUMN "subscription_platform_type" SET NOT NULL;

-- AlterTable
ALTER TABLE "employee_employments" RENAME COLUMN "employer_id" TO "company_id";

-- AlterTable
ALTER TABLE "transactions" RENAME COLUMN "employer_id" TO "company_id";
ALTER TABLE "transactions" DROP COLUMN "transaction_user_type";
ALTER TABLE "transactions" ADD COLUMN "transaction_platform_type" "platform_type";
UPDATE "transactions" SET "transaction_platform_type" = 'EMPLOYER' WHERE "transaction_platform_type" IS NULL AND "company_id" IS NOT NULL;
UPDATE "transactions" SET "transaction_platform_type" = 'EMPLOYEE' WHERE "transaction_platform_type" IS NULL;
ALTER TABLE "transactions" ALTER COLUMN "transaction_platform_type" SET NOT NULL;

-- AlterTable
ALTER TABLE "orders" RENAME COLUMN "employer_id" TO "company_id";
ALTER TABLE "orders" DROP COLUMN "order_user_type";
ALTER TABLE "orders" ADD COLUMN "order_platform_type" "platform_type";
UPDATE "orders" SET "order_platform_type" = 'EMPLOYER' WHERE "order_platform_type" IS NULL AND "company_id" IS NOT NULL;
UPDATE "orders" SET "order_platform_type" = 'EMPLOYEE' WHERE "order_platform_type" IS NULL;
ALTER TABLE "orders" ALTER COLUMN "order_platform_type" SET NOT NULL;

-- DropEnum
DROP TYPE "user_type";

-- CreateTable
CREATE TABLE "payroll_settings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "pay_frequency" VARCHAR NOT NULL DEFAULT 'monthly',
    "pay_day" VARCHAR NOT NULL DEFAULT 'last_working_day',
    "payroll_cutoff_day" INTEGER NOT NULL DEFAULT 28,
    "financial_year_start" VARCHAR NOT NULL DEFAULT 'april',
    "lock_after_processing" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payroll_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statutory_settings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employee_pf_rate" DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    "employer_pf_rate" DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    "employee_esic_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.75,
    "employer_esic_rate" DECIMAL(5,2) NOT NULL DEFAULT 3.25,
    "professional_tax" DECIMAL(10,2) NOT NULL DEFAULT 200.00,
    "labour_welfare_fund" DECIMAL(10,2) NOT NULL DEFAULT 6.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "statutory_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "default_disbursement_method" VARCHAR NOT NULL DEFAULT 'NEFT',
    "allow_bank_transfer" BOOLEAN NOT NULL DEFAULT true,
    "allow_upi" BOOLEAN NOT NULL DEFAULT true,
    "allow_cash" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_work_schedules" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "monday_working" BOOLEAN NOT NULL DEFAULT true,
    "tuesday_working" BOOLEAN NOT NULL DEFAULT true,
    "wednesday_working" BOOLEAN NOT NULL DEFAULT true,
    "thursday_working" BOOLEAN NOT NULL DEFAULT true,
    "friday_working" BOOLEAN NOT NULL DEFAULT true,
    "saturday_working" BOOLEAN NOT NULL DEFAULT true,
    "sunday_working" BOOLEAN NOT NULL DEFAULT false,
    "daily_work_hours" DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    "weekly_work_hours" DECIMAL(5,2) NOT NULL DEFAULT 48.00,
    "half_day_percentage" DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    "absent_deduction_type" VARCHAR NOT NULL DEFAULT 'per_day_rate',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtime_settings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ot_after_hours_per_day" DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    "ot_after_hours_per_week" DECIMAL(5,2) NOT NULL DEFAULT 48.00,
    "rate_multiplier" DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    "max_ot_hours_per_day" DECIMAL(4,2) NOT NULL DEFAULT 4.00,
    "include_holiday_ot" BOOLEAN NOT NULL DEFAULT true,
    "include_weekoff_ot" BOOLEAN NOT NULL DEFAULT true,
    "approval_required" BOOLEAN NOT NULL DEFAULT true,
    "auto_calculate_ot" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "overtime_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_shifts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_shifts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "company_member_id" UUID NOT NULL,
    "work_shift_id" UUID NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employee_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "company_member_id" UUID NOT NULL,
    "work_shift_id" UUID,
    "date" DATE NOT NULL,
    "check_in" TIMESTAMPTZ,
    "check_out" TIMESTAMPTZ,
    "worked_minutes" INTEGER NOT NULL DEFAULT 0,
    "ot_minutes" INTEGER NOT NULL DEFAULT 0,
    "status" "attendance_status" NOT NULL DEFAULT 'present',
    "source" "attendance_source" NOT NULL DEFAULT 'hr_manual',
    "marked_by_company_member_id" UUID,
    "notes" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_holidays" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" VARCHAR NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_roles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "parent_department_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_designations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "lead_company_member_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_members" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "department_id" UUID,
    "team_id" UUID,
    "role_id" UUID NOT NULL,
    "platform_type" "platform_type" NOT NULL,
    "manager_company_member_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_hr_profiles" (
    "id" UUID NOT NULL,
    "employment_id" UUID NOT NULL,
    "onboarding_stage" "onboarding_stage" NOT NULL DEFAULT 'onboard',
    "full_name" VARCHAR NOT NULL,
    "email" VARCHAR,
    "date_of_birth" DATE,
    "gender" VARCHAR,
    "address" TEXT,
    "blood_group" VARCHAR,
    "emergency_contact_name" VARCHAR,
    "emergency_contact_relation" VARCHAR,
    "emergency_contact_phone" VARCHAR,
    "designation_id" UUID,
    "branch_location" VARCHAR,
    "employee_type" VARCHAR,
    "work_location" VARCHAR,
    "skill_trade" VARCHAR,
    "experience_years" DECIMAL(5,2),
    "certification_licenses" TEXT,
    "safety_training_completed" BOOLEAN,
    "payment_method" VARCHAR,
    "payment_details" JSONB,
    "basic_salary" DECIMAL(12,2),
    "salary_type" VARCHAR,
    "salary_payment_frequency" VARCHAR,
    "overtime_eligible" BOOLEAN,
    "pf_applicable" BOOLEAN,
    "esi_applicable" BOOLEAN,
    "aadhaar_number" VARCHAR,
    "pan_number" VARCHAR,
    "driving_license_number" VARCHAR,
    "identity_document_url" TEXT,
    "additional_document_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employee_hr_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_company_name_idx" ON "companies"("company_name");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_settings_company_id_key" ON "payroll_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "statutory_settings_company_id_key" ON "statutory_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_settings_company_id_key" ON "payment_settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_work_schedules_company_id_key" ON "company_work_schedules"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "overtime_settings_company_id_key" ON "overtime_settings"("company_id");

-- CreateIndex
CREATE INDEX "work_shifts_company_id_idx" ON "work_shifts"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_shifts_company_id_name_key" ON "work_shifts"("company_id", "name");

-- CreateIndex
CREATE INDEX "employee_shifts_company_id_idx" ON "employee_shifts"("company_id");

-- CreateIndex
CREATE INDEX "employee_shifts_company_member_id_idx" ON "employee_shifts"("company_member_id");

-- CreateIndex
CREATE INDEX "employee_shifts_work_shift_id_idx" ON "employee_shifts"("work_shift_id");

-- CreateIndex
CREATE INDEX "employee_shifts_company_member_id_effective_from_idx" ON "employee_shifts"("company_member_id", "effective_from");

-- CreateIndex
CREATE INDEX "attendances_company_id_idx" ON "attendances"("company_id");

-- CreateIndex
CREATE INDEX "attendances_company_id_date_idx" ON "attendances"("company_id", "date");

-- CreateIndex
CREATE INDEX "attendances_company_member_id_idx" ON "attendances"("company_member_id");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_company_member_id_date_key" ON "attendances"("company_member_id", "date");

-- CreateIndex
CREATE INDEX "company_holidays_company_id_idx" ON "company_holidays"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_holidays_company_id_date_key" ON "company_holidays"("company_id", "date");

-- CreateIndex
CREATE INDEX "company_roles_company_id_idx" ON "company_roles"("company_id");

-- CreateIndex
CREATE INDEX "company_roles_code_idx" ON "company_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "company_roles_company_id_code_key" ON "company_roles"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "company_roles_company_id_name_key" ON "company_roles"("company_id", "name");

-- CreateIndex
CREATE INDEX "departments_company_id_idx" ON "departments"("company_id");

-- CreateIndex
CREATE INDEX "departments_parent_department_id_idx" ON "departments"("parent_department_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_company_id_name_key" ON "departments"("company_id", "name");

-- CreateIndex
CREATE INDEX "company_designations_company_id_idx" ON "company_designations"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_designations_company_id_name_key" ON "company_designations"("company_id", "name");

-- CreateIndex
CREATE INDEX "teams_department_id_idx" ON "teams"("department_id");

-- CreateIndex
CREATE INDEX "teams_lead_company_member_id_idx" ON "teams"("lead_company_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_department_id_name_key" ON "teams"("department_id", "name");

-- CreateIndex
CREATE INDEX "company_members_company_id_idx" ON "company_members"("company_id");

-- CreateIndex
CREATE INDEX "company_members_department_id_idx" ON "company_members"("department_id");

-- CreateIndex
CREATE INDEX "company_members_team_id_idx" ON "company_members"("team_id");

-- CreateIndex
CREATE INDEX "company_members_role_id_idx" ON "company_members"("role_id");

-- CreateIndex
CREATE INDEX "company_members_manager_company_member_id_idx" ON "company_members"("manager_company_member_id");

-- CreateIndex
CREATE INDEX "company_members_platform_type_idx" ON "company_members"("platform_type");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_user_id_key" ON "company_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_company_id_user_id_key" ON "company_members"("company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_hr_profiles_employment_id_key" ON "employee_hr_profiles"("employment_id");

-- CreateIndex
CREATE INDEX "employee_hr_profiles_designation_id_idx" ON "employee_hr_profiles"("designation_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "shifts_company_id_idx" ON "shifts"("company_id");

-- CreateIndex
CREATE INDEX "shifts_department_id_idx" ON "shifts"("department_id");

-- CreateIndex
CREATE INDEX "shifts_team_id_idx" ON "shifts"("team_id");

-- CreateIndex
CREATE INDEX "shifts_created_by_company_member_id_idx" ON "shifts"("created_by_company_member_id");

-- CreateIndex
CREATE INDEX "shifts_assigned_company_member_id_idx" ON "shifts"("assigned_company_member_id");

-- CreateIndex
CREATE INDEX "shifts_status_idx" ON "shifts"("status");

-- CreateIndex
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");

-- CreateIndex
CREATE INDEX "jobs_department_id_idx" ON "jobs"("department_id");

-- CreateIndex
CREATE INDEX "jobs_team_id_idx" ON "jobs"("team_id");

-- CreateIndex
CREATE INDEX "jobs_created_by_company_member_id_idx" ON "jobs"("created_by_company_member_id");

-- CreateIndex
CREATE INDEX "ratings_from_user_id_idx" ON "ratings"("from_user_id");

-- CreateIndex
CREATE INDEX "ratings_to_user_id_idx" ON "ratings"("to_user_id");

-- CreateIndex
CREATE INDEX "ratings_from_company_member_id_idx" ON "ratings"("from_company_member_id");

-- CreateIndex
CREATE INDEX "ratings_to_company_member_id_idx" ON "ratings"("to_company_member_id");

-- CreateIndex
CREATE INDEX "ratings_company_id_idx" ON "ratings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_shift_id_from_user_id_to_user_id_key" ON "ratings"("shift_id", "from_user_id", "to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_job_id_from_user_id_to_user_id_key" ON "ratings"("job_id", "from_user_id", "to_user_id");

-- CreateIndex
CREATE INDEX "subscriptions_company_id_idx" ON "subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "employee_employments_company_id_idx" ON "employee_employments"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_employments_company_id_employee_id_key" ON "employee_employments"("company_id", "employee_id");

-- CreateIndex
CREATE INDEX "transactions_company_id_idx" ON "transactions"("company_id");

-- CreateIndex
CREATE INDEX "orders_company_id_idx" ON "orders"("company_id");

-- AddForeignKey
ALTER TABLE "payroll_settings" ADD CONSTRAINT "payroll_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statutory_settings" ADD CONSTRAINT "statutory_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_work_schedules" ADD CONSTRAINT "company_work_schedules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime_settings" ADD CONSTRAINT "overtime_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_shifts" ADD CONSTRAINT "work_shifts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_company_member_id_fkey" FOREIGN KEY ("company_member_id") REFERENCES "company_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_work_shift_id_fkey" FOREIGN KEY ("work_shift_id") REFERENCES "work_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_company_member_id_fkey" FOREIGN KEY ("company_member_id") REFERENCES "company_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_work_shift_id_fkey" FOREIGN KEY ("work_shift_id") REFERENCES "work_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_marked_by_company_member_id_fkey" FOREIGN KEY ("marked_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_holidays" ADD CONSTRAINT "company_holidays_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_roles" ADD CONSTRAINT "company_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_department_id_fkey" FOREIGN KEY ("parent_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_designations" ADD CONSTRAINT "company_designations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_lead_company_member_id_fkey" FOREIGN KEY ("lead_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "company_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_manager_company_member_id_fkey" FOREIGN KEY ("manager_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_created_by_company_member_id_fkey" FOREIGN KEY ("created_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_assigned_company_member_id_fkey" FOREIGN KEY ("assigned_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_company_member_id_fkey" FOREIGN KEY ("created_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_from_company_member_id_fkey" FOREIGN KEY ("from_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_to_company_member_id_fkey" FOREIGN KEY ("to_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employments" ADD CONSTRAINT "employee_employments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_hr_profiles" ADD CONSTRAINT "employee_hr_profiles_employment_id_fkey" FOREIGN KEY ("employment_id") REFERENCES "employee_employments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_hr_profiles" ADD CONSTRAINT "employee_hr_profiles_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "company_designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
