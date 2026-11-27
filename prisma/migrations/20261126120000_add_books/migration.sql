-- Keep the backfill and constraints atomic if financial data has no admin to own it.
BEGIN;

-- 1. Create the book schema and lock down the new tables.
CREATE TYPE "BookRole" AS ENUM ('editor', 'viewer');

CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookMember" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BookRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookInvitation" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "role" "BookRole" NOT NULL,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookInvitation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN "activeBookId" TEXT;

ALTER TABLE "Book" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookInvitation" ENABLE ROW LEVEL SECURITY;

-- 2. Give every existing user an empty book.
INSERT INTO "Book" (id, name, "ownerId")
SELECT gen_random_uuid()::text, 'Mi libro', id FROM "User";

-- 3. Assign all existing financial data to the oldest admin's book.
ALTER TABLE "Account" ADD COLUMN "bookId" TEXT;
ALTER TABLE "Category" ADD COLUMN "bookId" TEXT;
ALTER TABLE "Budget" ADD COLUMN "bookId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "bookId" TEXT;

UPDATE "Account" SET "bookId" = (
    SELECT id FROM "Book" WHERE "ownerId" = (
        SELECT id FROM "User" WHERE role = 'admin' ORDER BY "createdAt" LIMIT 1
    )
);
UPDATE "Category" SET "bookId" = (
    SELECT id FROM "Book" WHERE "ownerId" = (
        SELECT id FROM "User" WHERE role = 'admin' ORDER BY "createdAt" LIMIT 1
    )
);
UPDATE "Budget" SET "bookId" = (
    SELECT id FROM "Book" WHERE "ownerId" = (
        SELECT id FROM "User" WHERE role = 'admin' ORDER BY "createdAt" LIMIT 1
    )
);
UPDATE "Expense" SET "bookId" = (
    SELECT id FROM "Book" WHERE "ownerId" = (
        SELECT id FROM "User" WHERE role = 'admin' ORDER BY "createdAt" LIMIT 1
    )
);

-- 4. Enforce book ownership, per-book uniqueness and matching financial references.
ALTER TABLE "Account" ALTER COLUMN "bookId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "bookId" SET NOT NULL;
ALTER TABLE "Budget" ALTER COLUMN "bookId" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "bookId" SET NOT NULL;

CREATE UNIQUE INDEX "Account_bookId_name_key" ON "Account"("bookId", "name");
CREATE UNIQUE INDEX "Account_id_bookId_key" ON "Account"("id", "bookId");
CREATE UNIQUE INDEX "Budget_bookId_type_key" ON "Budget"("bookId", "type");
CREATE UNIQUE INDEX "Category_bookId_name_key" ON "Category"("bookId", "name");
CREATE UNIQUE INDEX "Category_id_bookId_key" ON "Category"("id", "bookId");
CREATE INDEX "Book_ownerId_idx" ON "Book"("ownerId");
CREATE INDEX "BookMember_userId_idx" ON "BookMember"("userId");
CREATE UNIQUE INDEX "BookMember_bookId_userId_key" ON "BookMember"("bookId", "userId");
CREATE UNIQUE INDEX "BookInvitation_tokenHash_key" ON "BookInvitation"("tokenHash");
CREATE INDEX "BookInvitation_bookId_idx" ON "BookInvitation"("bookId");
CREATE UNIQUE INDEX "Expense_id_bookId_key" ON "Expense"("id", "bookId");

ALTER TABLE "Expense" DROP CONSTRAINT "Expense_accountId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_categoryId_fkey";

ALTER TABLE "Account" ADD CONSTRAINT "Account_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Book" ADD CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookMember" ADD CONSTRAINT "BookMember_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookMember" ADD CONSTRAINT "BookMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookInvitation" ADD CONSTRAINT "BookInvitation_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_activeBookId_fkey" FOREIGN KEY ("activeBookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_accountId_bookId_fkey" FOREIGN KEY ("accountId", "bookId") REFERENCES "Account"("id", "bookId") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_bookId_fkey" FOREIGN KEY ("categoryId", "bookId") REFERENCES "Category"("id", "bookId") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "Account_name_key";
DROP INDEX "Category_name_key";
DROP INDEX "Budget_type_key";

-- 5. Remember each user's own book as active.
UPDATE "User" SET "activeBookId" = (
    SELECT id FROM "Book" WHERE "ownerId" = "User".id
);

COMMIT;
