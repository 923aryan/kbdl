-- Ensure OTP upsert/find composite unique indexes exist (fixes ON CONFLICT errors on send OTP).

DROP INDEX IF EXISTS "otp_verifications_phone_no_key";
DROP INDEX IF EXISTS "otp_verifications_email_key";

CREATE UNIQUE INDEX IF NOT EXISTS "otp_verifications_phone_no_role_key"
  ON "otp_verifications" ("phone_no", "role");

CREATE UNIQUE INDEX IF NOT EXISTS "otp_verifications_email_role_key"
  ON "otp_verifications" ("email", "role");
