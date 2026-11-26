"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";
import { consumeToken, findToken } from "@/lib/user-tokens";
import { hashPassword } from "@/lib/password";
import { validateNewPassword } from "@/lib/user-validation";
import { hashToken } from "@/lib/session";
import { resendConfirmationTo } from "@/lib/account-flows";
import { withMinimumDuration } from "@/lib/timing";
import { logEvent } from "@/lib/log";

export type ConfirmState = { error?: string; fieldErrors?: { password?: string; confirm?: string } } | undefined;
export type ResendState = { sent?: boolean; error?: string; values?: { email: string } } | undefined;

// Only this action spends the link; opening the page just reads it, so mail scanners can't use it up.
export async function confirmEmail(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const { t } = await getTranslations();
  const token = String(formData.get("token") ?? "");
  const preview = await findToken(token, ["confirm", "email_change"]);
  if (!preview) return { error: t.confirmEmail.invalidBody };
  const requiresPassword = preview.purpose === "confirm" && preview.user.passwordReplaced;
  let credential: Awaited<ReturnType<typeof hashPassword>> | undefined;
  if (requiresPassword) {
    const password = String(formData.get("password") ?? "");
    const errors = validateNewPassword(password, String(formData.get("confirm") ?? ""));
    if (errors.password || errors.confirm) {
      return { fieldErrors: {
        password: errors.password && t.validation[errors.password],
        confirm: errors.confirm && t.validation[errors.confirm],
      } };
    }
    credential = await hashPassword(password);
  }
  const staleConfirmation = new Error("stale_confirmation");
  let notice: string;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const row = await consumeToken(tx, token, ["confirm", "email_change"]);
      if (!row) return "invalid" as const;
      if (row.purpose === "confirm") {
        const { count } = await tx.user.updateMany({
          where: {
            id: row.userId, emailVerifiedAt: null,
            passwordReplaced: preview.user.passwordReplaced, passwordHash: preview.user.passwordHash,
          },
          data: {
            emailVerifiedAt: new Date(),
            ...(credential && { passwordHash: credential.hash, passwordSalt: credential.salt, passwordReplaced: false }),
          },
        });
        // A replacement after the preview must not confirm a password the owner never chose.
        if (!count) throw staleConfirmation;
        await tx.userToken.deleteMany({ where: { userId: row.userId, purpose: "confirm" } });
        logEvent("email_confirmed", { userId: row.userId });
        return "confirmed" as const;
      }
      await tx.user.update({ where: { id: row.userId }, data: { email: row.newEmail ?? undefined } });
      await tx.userToken.deleteMany({
        where: { userId: row.userId, purpose: { in: ["reset", "confirm"] } },
      });
      logEvent("email_changed", { userId: row.userId });
      return "changed" as const;
    });
    if (outcome === "invalid") return { error: t.confirmEmail.invalidBody };
    notice = outcome === "confirmed" ? "emailConfirmed" : "emailChanged";
  } catch (error) {
    if (error === staleConfirmation) return { error: t.confirmEmail.invalidBody };
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
  return result === "failed" ? { error: t.resend.emailNotSent, values: { email } } : { sent: true };
}
