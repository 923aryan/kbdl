-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "company_location" geography(Point, 4326);

-- AlterTable
ALTER TABLE "push_tokens" ALTER COLUMN "platform" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
