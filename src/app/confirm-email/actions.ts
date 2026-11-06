"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";
import { consumeToken } from "@/lib/user-tokens";
import { hashToken } from "@/lib/session";
import { resendConfirmationTo } from "@/lib/account-flows";
import { withMinimumDuration } from "@/lib/timing";
import { logEvent } from "@/lib/log";

export type ConfirmState = { error?: string } | undefined;
export type ResendState = { sent?: boolean; error?: string } | undefined;

// Only this action spends the link; opening the page just reads it, so mail scanners can't use it up.
export async function confirmEmail(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const { t } = await getTranslations();
  const token = String(formData.get("token") ?? "");
  let notice: string;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const row = await consumeToken(tx, token, ["confirm", "email_change"]);
      if (!row) return "invalid" as const;
      if (row.purpose === "confirm") {
        await tx.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
        await tx.userToken.deleteMany({ where: { userId: row.userId, purpose: "confirm" } });
        logEvent("email_confirmed", { userId: row.userId });
        return "confirmed" as const;
      }
      await tx.user.update({ where: { id: row.userId }, data: { email: row.newEmail ?? undefined } });
      logEvent("email_changed", { userId: row.userId });
      return "changed" as const;
    });
    if (outcome === "invalid") return { error: t.confirmEmail.invalidBody };
    notice = outcome === "confirmed" ? "emailConfirmed" : "emailChanged";
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // The rollback restored the token; the link is spent anyway and the old email stays.
      await prisma.userToken.deleteMany({ where: { tokenHash: hashToken(token) } });
      return { error: t.confirmEmail.emailTaken };
    }
    throw error;
  }
  redirect(`/login?notice=${notice}`);
}

// Same answer for any address; only Pending accounts actually get mail.
export async function requestConfirmation(
  _prev: ResendState,
  formData: FormData
): Promise<ResendState> {
  const { t } = await getTranslations();
  const email = String(formData.get("email") ?? "");
  const result = await withMinimumDuration(1500, () => resendConfirmationTo(email, t));
  return result === "failed" ? { error: t.resend.emailNotSent } : { sent: true };
}
