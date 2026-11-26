import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
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

// Prepare the account and rotate its link atomically; retry the entire operation on a concurrent rotation.
export async function createToken(
  purpose: TokenPurpose,
  prepareUser: (db: Db) => Promise<string | null>,
  newEmail?: string
): Promise<string | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(async (db) => {
        const userId = await prepareUser(db);
        if (!userId) return null;
        const token = randomBytes(32).toString("hex");
        await db.userToken.deleteMany({
          where: { OR: [{ userId, purpose }, { expiresAt: { lt: new Date() } }] },
        });
        await db.userToken.create({
          data: {
            tokenHash: hashToken(token), purpose, newEmail: newEmail ?? null, userId,
            expiresAt: new Date(Date.now() + TTL_MS[purpose]),
          },
        });
        return token;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (attempt >= 2 || !(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")) {
        throw error;
      }
    }
  }
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
