/*
  Warnings:

  - A unique constraint covering the columns `[shift_id,user_id,employer_id]` on the table `ratings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shift_id,user_id,user_employer_id]` on the table `ratings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ratings" ADD COLUMN     "review" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ratings_shift_id_user_id_employer_id_key" ON "ratings"("shift_id", "user_id", "employer_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_shift_id_user_id_user_employer_id_key" ON "ratings"("shift_id", "user_id", "user_employer_id");
