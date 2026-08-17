-- Extra HR documents per employment profile (education, police verification, etc.)
CREATE TABLE "employee_hr_documents" (
    "id" UUID NOT NULL,
    "hr_profile_id" UUID NOT NULL,
    "document_type" VARCHAR(120) NOT NULL,
    "document_number" VARCHAR(80),
    "file_key" TEXT NOT NULL,
    "file_name" VARCHAR(255),
    "expiry_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employee_hr_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "employee_hr_documents_hr_profile_id_idx" ON "employee_hr_documents"("hr_profile_id");

ALTER TABLE "employee_hr_documents" ADD CONSTRAINT "employee_hr_documents_hr_profile_id_fkey" FOREIGN KEY ("hr_profile_id") REFERENCES "employee_hr_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
