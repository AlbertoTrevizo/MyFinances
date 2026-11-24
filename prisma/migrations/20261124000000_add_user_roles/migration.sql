CREATE TYPE "Role" AS ENUM ('user', 'admin');
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'user';
-- ROL-6
UPDATE "User" SET "role" = 'admin' WHERE "isAdmin" = true;
