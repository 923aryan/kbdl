-- CreateEnum
CREATE TYPE "leave_request_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "company_leave_policies" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "accrue_per_month" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    "annual_quota" DECIMAL(6,2) NOT NULL DEFAULT 12.00,
    "max_carry_forward" INTEGER NOT NULL DEFAULT 12,
    "carry_forward_at_year_end" BOOLEAN NOT NULL DEFAULT true,
    "encash_excess" BOOLEAN NOT NULL DEFAULT true,
    "policy_lines" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_leave_types" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "days_per_year" DECIMAL(6,2) NOT NULL DEFAULT 12.00,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "employment_id" UUID NOT NULL,
    "leave_type_id" UUID NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "days" DECIMAL(6,2) NOT NULL,
    "reason" VARCHAR NOT NULL,
    "status" "leave_request_status" NOT NULL DEFAULT 'pending',
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_leave_policies_company_id_key" ON "company_leave_policies"("company_id");
CREATE UNIQUE INDEX "company_leave_types_company_id_name_key" ON "company_leave_types"("company_id", "name");
CREATE INDEX "company_leave_types_company_id_idx" ON "company_leave_types"("company_id");
CREATE INDEX "leave_requests_company_id_idx" ON "leave_requests"("company_id");
CREATE INDEX "leave_requests_employment_id_idx" ON "leave_requests"("employment_id");
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

ALTER TABLE "company_leave_policies" ADD CONSTRAINT "company_leave_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_leave_types" ADD CONSTRAINT "company_leave_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employment_id_fkey" FOREIGN KEY ("employment_id") REFERENCES "employee_employments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "company_leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
