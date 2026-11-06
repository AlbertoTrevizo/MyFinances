import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { hashToken } from "./session";

export type TokenPurpose = "confirm" | "email_change" | "reset";
type Db = Prisma.TransactionClient;

const HOUR_MS = 60 * 60 * 1000;
const TTL_MS: Record<TokenPurpose, number> = {
  confirm: 24 * HOUR_MS,
  email_change: 24 * HOUR_MS,
  reset: HOUR_MS,
};

// Returns the raw token (for the link). Only its hash is stored, and any earlier token of the same purpose is annulled.
export async function createToken(
  db: Db,
  userId: string,
  purpose: TokenPurpose,
  newEmail?: string
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.userToken.deleteMany({
    where: { OR: [{ userId, purpose }, { expiresAt: { lt: new Date() } }] },
  });
  await db.userToken.create({
    data: {
      tokenHash: hashToken(token),
      purpose,
      newEmail: newEmail ?? null,
      userId,
      expiresAt: new Date(Date.now() + TTL_MS[purpose]),
    },
  });
  return token;
}

// Read-only: opening a link must not spend it.
export async function findToken(token: string, purposes: TokenPurpose[]) {
  const row = await prisma.userToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!row || row.expiresAt <= new Date()) return null;
  return purposes.includes(row.purpose as TokenPurpose) ? row : null;
}

// Call inside a transaction. The delete claims the token, so a double click can't use a link twice.
export async function consumeToken(db: Db, token: string, purposes: TokenPurpose[]) {
  const tokenHash = hashToken(token);
  const row = await db.userToken.findUnique({ where: { tokenHash } });
  if (!row || !purposes.includes(row.purpose as TokenPurpose)) return null;
  const { count } = await db.userToken.deleteMany({
    where: { tokenHash, expiresAt: { gt: new Date() } },
  });
  return count === 0 ? null : row;
}
