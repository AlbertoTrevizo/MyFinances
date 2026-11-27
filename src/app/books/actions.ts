"use server";

import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "@/i18n/get-locale";
import { deleteBook as deleteBookData } from "@/lib/book-data";
import { parseMemberRole, validateBookName } from "@/lib/book-rules";
import { logEvent } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { hashToken, requireUser } from "@/lib/session";
import { validateEmail } from "@/lib/user-validation";
import { withEmailSlot } from "@/lib/email-reservation";
import { reserveEmailSlot, releaseEmailSlot } from "@/lib/email";
import { sendAccountEmail } from "@/lib/account-emails";
import { appUrl } from "@/lib/app-url";

export type ActionState = { ok?: boolean; error?: string; values?: { name: string } } | undefined;
export type InviteState = { ok?: boolean; error?: string; url?: string } | undefined;

export async function inviteByEmail(bookId: string, _prev: InviteState, formData: FormData): Promise<InviteState> {
  const user = await requireUser();
  const book = await prisma.book.findFirst({ where: { id: bookId, ownerId: user.id }, select: { id: true } });
  if (!book) notFound();
  const { t } = await getTranslations();
  const email = validateEmail(String(formData.get("email") ?? ""));
  if (email.error) return { error: t.validation[email.error] };
  const role = parseMemberRole(formData.get("role"));
  if (!role) return { error: t.books.errors.invalidRole };
  const member = await prisma.user.findFirst({
    where: { email: { equals: email.value, mode: "insensitive" }, OR: [{ id: user.id }, { memberships: { some: { bookId } } }] },
    select: { id: true },
  });
  if (member) return { error: t.books.errors.alreadyMember };

  const result = await withEmailSlot(
    () => reserveEmailSlot(email.value),
    async (slot) => {
      const token = randomBytes(32).toString("hex");
      const invitation = await prisma.bookInvitation.create({
        data: { bookId, email: email.value, role, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });
      let sent;
      try {
        sent = await sendAccountEmail("invitation", email.value, t, token, slot);
      } catch {
        logEvent("book_invitation_failed", { bookId, by: user.id });
        sent = "failed" as const;
      }
      if (sent === "sent") {
        await prisma.bookInvitation.deleteMany({ where: { bookId, email: email.value, id: { not: invitation.id } } });
      } else {
        await prisma.bookInvitation.deleteMany({ where: { id: invitation.id } });
      }
      return sent;
    },
    releaseEmailSlot,
  );
  if (result !== "sent") return { error: t.books.errors[result] };
  logEvent("book_invitation_created", { bookId, by: user.id, kind: "email" });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createInviteLink(bookId: string, _prev: InviteState, formData: FormData): Promise<InviteState> {
  const user = await requireUser();
  const book = await prisma.book.findFirst({ where: { id: bookId, ownerId: user.id }, select: { id: true } });
  if (!book) notFound();
  const { t } = await getTranslations();
  const role = parseMemberRole(formData.get("role"));
  if (!role) return { error: t.books.errors.invalidRole };
  const base = appUrl();
  if (!base) return { error: t.books.errors.failed };
  const token = randomBytes(32).toString("hex");
  const url = new URL(`/invitations?token=${token}`, base).toString();
  await prisma.bookInvitation.create({
    data: { bookId, email: null, role, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  logEvent("book_invitation_created", { bookId, by: user.id, kind: "link" });
  revalidatePath("/", "layout");
  return { ok: true, url };
}

export async function revokeInvitation(bookId: string, invitationId: string): Promise<ActionState> {
  const user = await requireUser();
  const book = await prisma.book.findFirst({ where: { id: bookId, ownerId: user.id }, select: { id: true } });
  if (!book) notFound();
  await prisma.bookInvitation.deleteMany({ where: { id: invitationId, bookId } });
  logEvent("book_invitation_revoked", { bookId, invitationId, by: user.id });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createBook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  const values = { name: String(formData.get("name") ?? "") };
  const result = validateBookName(values.name);
  if ("error" in result) return { error: t.books.errors[result.error], values };

  const book = await prisma.$transaction(async (tx) => {
    const created = await tx.book.create({ data: { name: result.name, ownerId: user.id } });
    await tx.user.update({ where: { id: user.id }, data: { activeBookId: created.id } });
    return created;
  });
  logEvent("book_created", { bookId: book.id, by: user.id });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function renameBook(bookId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  const values = { name: String(formData.get("name") ?? "") };
  const result = validateBookName(values.name);
  if ("error" in result) return { error: t.books.errors[result.error], values };

  const { count } = await prisma.book.updateMany({
    where: { id: bookId, ownerId: user.id },
    data: { name: result.name },
  });
  if (!count) notFound();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBook(bookId: string): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  try {
    await prisma.$transaction(async (tx) => {
      const book = await tx.book.findFirst({ where: { id: bookId, ownerId: user.id }, select: { id: true } });
      if (!book) notFound();
      await deleteBookData(tx, bookId);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
    if (code === "P2034") return { error: t.books.errors.conflict };
    if (code === "P2025") return { error: t.books.errors.notFound };
    throw error;
  }
  logEvent("book_deleted", { bookId, by: user.id });
  revalidatePath("/", "layout");
  redirect("/books");
}

export async function setActiveBook(bookId: string): Promise<void> {
  const user = await requireUser();
  const book = await prisma.book.findFirst({
    where: { id: bookId, OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    select: { id: true },
  });
  if (!book) notFound();
  await prisma.user.update({ where: { id: user.id }, data: { activeBookId: bookId } });
  revalidatePath("/", "layout");
}

export async function setMemberRole(
  bookId: string,
  memberUserId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  const role = parseMemberRole(formData.get("role"));
  if (!role) return { error: t.books.errors.invalidRole };

  let outcome;
  try {
    outcome = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findFirst({ where: { id: bookId, ownerId: user.id }, select: { id: true } });
      if (!book) notFound();
      const member = await tx.bookMember.findUnique({ where: { bookId_userId: { bookId, userId: memberUserId } } });
      if (!member || memberUserId === user.id) return null;
      if (member.role !== role) {
        await tx.bookMember.update({ where: { id: member.id }, data: { role } });
      }
      return { from: member.role };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
    if (code === "P2034") return { error: t.books.errors.conflict };
    if (code === "P2025") return { error: t.books.errors.notFound };
    throw error;
  }
  if (!outcome) return { error: t.books.errors.notFound };
  if (outcome.from !== role) {
    logEvent("book_member_role_changed", { bookId, userId: memberUserId, by: user.id, from: outcome.from, to: role });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeMember(bookId: string, memberUserId: string): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  let removed;
  try {
    removed = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findFirst({ where: { id: bookId, ownerId: user.id }, select: { id: true } });
      if (!book || memberUserId === user.id) notFound();
      return tx.bookMember.deleteMany({ where: { bookId, userId: memberUserId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
    if (code === "P2034") return { error: t.books.errors.conflict };
    if (code === "P2025") return { error: t.books.errors.notFound };
    throw error;
  }
  if (!removed.count) return { error: t.books.errors.notFound };
  logEvent("book_member_removed", { bookId, userId: memberUserId, by: user.id });
  revalidatePath("/", "layout");
  return undefined;
}

export async function leaveBook(bookId: string): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getTranslations();
  let outcome;
  try {
    outcome = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId }, select: { ownerId: true } });
      if (!book) return "notFound" as const;
      if (book.ownerId === user.id) return "ownerCannotLeave" as const;
      const { count } = await tx.bookMember.deleteMany({ where: { bookId, userId: user.id } });
      return count ? null : "notFound" as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
    if (code === "P2034") return { error: t.books.errors.conflict };
    if (code === "P2025") return { error: t.books.errors.notFound };
    throw error;
  }
  if (outcome) return { error: t.books.errors[outcome] };
  logEvent("book_member_left", { bookId, userId: user.id, by: user.id });
  revalidatePath("/", "layout");
  redirect("/books");
}
