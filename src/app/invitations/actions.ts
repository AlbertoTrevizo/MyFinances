"use server";

import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { invitationDecision } from "@/lib/book-rules";
import { logEvent } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { hashToken, requireUser } from "@/lib/session";

export type InvitationState = { error: "invalid" | "wrongAccount" | "alreadyMember" | "conflict" } | undefined;

export async function acceptInvitation(token: string): Promise<InvitationState> {
  const user = await requireUser();
  let outcome;
  try {
    outcome = await prisma.$transaction(async (tx) => {
      const invitation = await tx.bookInvitation.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { book: { select: { ownerId: true } } },
      });
      if (!invitation) return { error: "invalid" as const };
      const member = await tx.bookMember.findUnique({
        where: { bookId_userId: { bookId: invitation.bookId, userId: user.id } },
      });
      const access = invitation.book.ownerId === user.id ? "owner" : member?.role ?? null;
      const decision = invitationDecision({ invitation, now: new Date(), userEmail: user.email, access });
      if (decision !== "accept") return { error: decision };

      const { count } = await tx.bookInvitation.deleteMany({ where: { id: invitation.id } });
      if (!count) return { error: "invalid" as const };
      await tx.bookMember.create({ data: { bookId: invitation.bookId, userId: user.id, role: invitation.role } });
      await tx.user.update({ where: { id: user.id }, data: { activeBookId: invitation.bookId } });
      return { bookId: invitation.bookId };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
    if (code === "P2002") return { error: "alreadyMember" };
    if (code === "P2034") return { error: "conflict" };
    throw error;
  }
  if (outcome.error) return { error: outcome.error };
  (await cookies()).delete("invitation_return");
  logEvent("book_invitation_accepted", { bookId: outcome.bookId, userId: user.id });
  revalidatePath("/", "layout");
  redirect("/");
}
