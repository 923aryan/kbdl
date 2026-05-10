/*
  Warnings:

  - Added the required column `created_by` to the `shifts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payType` to the `shifts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shift_pay` to the `shifts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "pay_type" AS ENUM ('HOURLY', 'FIXED');

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "created_by" "user_type" NOT NULL,
ADD COLUMN     "payType" "pay_type" NOT NULL,
ADD COLUMN     "request_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shift_pay" DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobileNumber" VARCHAR(20) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");
