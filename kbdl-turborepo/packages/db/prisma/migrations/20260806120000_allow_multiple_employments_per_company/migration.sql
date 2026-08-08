-- Allow multiple employment stints per user at the same company (rehire as new row).
DROP INDEX IF EXISTS "employee_employments_company_id_employee_id_key";
DROP INDEX IF EXISTS "employee_employments_employer_id_employee_id_key";

CREATE INDEX IF NOT EXISTS "employee_employments_company_id_employee_id_idx"
  ON "employee_employments"("company_id", "employee_id");
