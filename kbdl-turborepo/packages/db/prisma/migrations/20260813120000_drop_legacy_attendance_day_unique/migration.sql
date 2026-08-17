-- Safety: drop legacy one-row-per-day unique if it survived db push.
-- Per-shift attendance uses (company_member_id, date, work_shift_id) instead.
DROP INDEX IF EXISTS "attendances_company_member_id_date_key";
