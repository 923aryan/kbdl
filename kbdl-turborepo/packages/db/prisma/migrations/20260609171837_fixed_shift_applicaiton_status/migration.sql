/*
  Warnings:

  - You are about to drop the `ShiftApplication` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "shift_application_type" AS ENUM ('invited', 'applied');

-- DropForeignKey
ALTER TABLE "ShiftApplication" DROP CONSTRAINT "ShiftApplication_shift_id_fkey";

-- DropForeignKey
ALTER TABLE "ShiftApplication" DROP CONSTRAINT "ShiftApplication_user_id_fkey";

-- DropTable
DROP TABLE "ShiftApplication";

-- CreateTable
CREATE TABLE "shift_applications" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "shift_application_type" NOT NULL,
    "status" "shift_application_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shift_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_applications_shift_id_idx" ON "shift_applications"("shift_id");

-- CreateIndex
CREATE INDEX "shift_applications_user_id_idx" ON "shift_applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shift_applications_shift_id_user_id_key" ON "shift_applications"("shift_id", "user_id");

-- AddForeignKey
ALTER TABLE "shift_applications" ADD CONSTRAINT "shift_applications_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_applications" ADD CONSTRAINT "shift_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
