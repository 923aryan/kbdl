-- Attendance MVP: HR-editable breaks, manual OT, shift mismatch flag
ALTER TABLE "attendances"
  ADD COLUMN "lunch_break_minutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "tea_break_minutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "is_ot" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ot_reason" VARCHAR,
  ADD COLUMN "shift_mismatch" BOOLEAN NOT NULL DEFAULT false;
