ALTER TABLE "admins" ADD COLUMN "phone_no" VARCHAR;

UPDATE "admins"
SET "phone_no" = '+91' || lpad(right(replace("id"::text, '-', ''), 10), 10, '0')
WHERE "phone_no" IS NULL;

UPDATE "admins"
SET "phone_no" = '+919000000000'
WHERE "email" = 'admin@kbdl.dev';

ALTER TABLE "admins" ALTER COLUMN "phone_no" SET NOT NULL;

CREATE UNIQUE INDEX "admins_phone_no_key" ON "admins"("phone_no");
