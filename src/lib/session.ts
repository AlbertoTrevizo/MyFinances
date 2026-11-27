import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { randomBytes, createHash } from "crypto";
import { prisma } from "./prisma";
import { isAdmin } from "./roles";
import { canWrite, invitationReturnPath, pickActiveBook } from "./book-rules";
import { getTranslations } from "@/i18n/get-locale";

const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export async function takeInvitationReturn(): Promise<string> {
  const cookieStore = await cookies();
  const value = cookieStore.get("invitation_return")?.value;
  cookieStore.delete("invitation_return");
  return invitationReturnPath(value) ?? "/";
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, db: Prisma.TransactionClient = prisma): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({ data: { userId, tokenHash, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session.user;
});

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(COOKIE_NAME);
}

// Every Server Action and page calls this; the proxy is only a first, optimistic layer.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) redirect("/login");
  if (user.profileIncomplete) redirect("/complete-profile");
  return user;
}

// Only administrators may view or manage users and roles.
export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/");
  return user;
}

export const resolveBook = cache(async (user: { id: string; activeBookId: string | null }) => {
  const [owned, memberships] = await Promise.all([
    prisma.book.findMany({ where: { ownerId: user.id } }),
    prisma.bookMember.findMany({ where: { userId: user.id }, include: { book: true } }),
  ]);
  const available = [
    ...owned.map((book) => ({ id: book.id, name: book.name, access: "owner" as const, joinedAt: book.createdAt })),
    ...memberships.map((member) => ({ id: member.book.id, name: member.book.name, access: member.role, joinedAt: member.createdAt })),
  ];
  const chosenId = pickActiveBook(user.activeBookId, available);
  let chosen = available.find((book) => book.id === chosenId);
  if (!chosen) {
    const { t } = await getTranslations();
    const book = await prisma.book.create({ data: { name: t.books.defaultName, ownerId: user.id } });
    chosen = { id: book.id, name: book.name, access: "owner", joinedAt: book.createdAt };
    available.push(chosen);
  }
  if (chosen.id !== user.activeBookId) {
    await prisma.user.update({ where: { id: user.id }, data: { activeBookId: chosen.id } });
  }
  return {
    book: { id: chosen.id, name: chosen.name },
    access: chosen.access,
    books: available.map(({ id, name, access }) => ({ id, name, access })),
  };
});

export async function requireBook() {
  const user = await requireUser();
  return { user, ...(await resolveBook(user)) };
}

export async function requireBookWriter() {
  const context = await requireBook();
  if (!canWrite(context.access)) redirect("/");
  return context;
}
