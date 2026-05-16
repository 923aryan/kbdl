-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'admin',
ALTER COLUMN "role" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "employers" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'employer';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';
