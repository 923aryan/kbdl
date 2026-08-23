-- CreateEnum
CREATE TYPE "payroll_run_status" AS ENUM ('draft', 'attendance_confirmed', 'wages_confirmed', 'deductions_confirmed', 'disbursed');

-- CreateEnum
CREATE TYPE "payroll_payslip_status" AS ENUM ('pending', 'generated', 'sent');

-- CreateEnum
CREATE TYPE "payroll_statutory_kind" AS ENUM ('epf', 'esic', 'lwf', 'pt', 'tds');

-- CreateEnum
CREATE TYPE "payroll_filing_status" AS ENUM ('pending', 'filed');

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" "payroll_run_status" NOT NULL DEFAULT 'draft',
    "disbursement_method" VARCHAR NOT NULL DEFAULT 'NEFT',
    "created_by_company_member_id" UUID,
    "attendance_confirmed_at" TIMESTAMPTZ,
    "attendance_confirmed_by_company_member_id" UUID,
    "wages_confirmed_at" TIMESTAMPTZ,
    "wages_confirmed_by_company_member_id" UUID,
    "deductions_confirmed_at" TIMESTAMPTZ,
    "deductions_confirmed_by_company_member_id" UUID,
    "disbursed_at" TIMESTAMPTZ,
    "disbursed_by_company_member_id" UUID,
    "worker_count" INTEGER NOT NULL DEFAULT 0,
    "flagged_count" INTEGER NOT NULL DEFAULT 0,
    "total_gross" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_basic" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_ot_pay" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_allowance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_deduction" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_net" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run_employees" (
    "id" UUID NOT NULL,
    "payroll_run_id" UUID NOT NULL,
    "employment_id" UUID NOT NULL,
    "employee_no" VARCHAR,
    "full_name" VARCHAR NOT NULL,
    "designation" VARCHAR NOT NULL,
    "department" VARCHAR NOT NULL,
    "contract" VARCHAR NOT NULL,
    "bank_label" VARCHAR NOT NULL,
    "payment_mode" VARCHAR NOT NULL,
    "pan_masked" VARCHAR,
    "ifsc" VARCHAR,
    "present_days" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "leave_days" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "absent_days" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "ot_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "payable_days" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "rate_per_day" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ot_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "basic" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ot_pay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "epf_covered" BOOLEAN NOT NULL DEFAULT false,
    "esic_covered" BOOLEAN NOT NULL DEFAULT false,
    "epf" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "esic" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tds" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lwf" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "custom_deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employer_epf" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employer_esic" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payslip_status" "payroll_payslip_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payroll_run_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_statutory_filings" (
    "id" UUID NOT NULL,
    "payroll_run_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "kind" "payroll_statutory_kind" NOT NULL,
    "title" VARCHAR NOT NULL,
    "subtitle" VARCHAR NOT NULL,
    "employer_share" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employee_share" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "due_date" DATE NOT NULL,
    "status" "payroll_filing_status" NOT NULL DEFAULT 'pending',
    "filed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payroll_statutory_filings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payroll_runs_company_id_period_year_period_month_key" ON "payroll_runs"("company_id", "period_year", "period_month");
CREATE INDEX "payroll_runs_company_id_idx" ON "payroll_runs"("company_id");
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs"("status");

CREATE UNIQUE INDEX "payroll_run_employees_payroll_run_id_employment_id_key" ON "payroll_run_employees"("payroll_run_id", "employment_id");
CREATE INDEX "payroll_run_employees_payroll_run_id_idx" ON "payroll_run_employees"("payroll_run_id");
CREATE INDEX "payroll_run_employees_employment_id_idx" ON "payroll_run_employees"("employment_id");

CREATE UNIQUE INDEX "payroll_statutory_filings_payroll_run_id_kind_key" ON "payroll_statutory_filings"("payroll_run_id", "kind");
CREATE INDEX "payroll_statutory_filings_company_id_idx" ON "payroll_statutory_filings"("company_id");

ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_created_by_company_member_id_fkey" FOREIGN KEY ("created_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_attendance_confirmed_by_company_member_id_fkey" FOREIGN KEY ("attendance_confirmed_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_wages_confirmed_by_company_member_id_fkey" FOREIGN KEY ("wages_confirmed_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_deductions_confirmed_by_company_member_id_fkey" FOREIGN KEY ("deductions_confirmed_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_disbursed_by_company_member_id_fkey" FOREIGN KEY ("disbursed_by_company_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_employment_id_fkey" FOREIGN KEY ("employment_id") REFERENCES "employee_employments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payroll_statutory_filings" ADD CONSTRAINT "payroll_statutory_filings_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_statutory_filings" ADD CONSTRAINT "payroll_statutory_filings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
