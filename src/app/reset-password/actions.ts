"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getTranslations } from "@/i18n/get-locale";
import { consumeToken } from "@/lib/user-tokens";
import { validateNewPassword } from "@/lib/user-validation";
import { logEvent } from "@/lib/log";

export type ResetState =
  | { fieldErrors?: { password?: string; confirm?: string }; invalid?: boolean }
  | undefined;

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const { t } = await getTranslations();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const errors = validateNewPassword(password, String(formData.get("confirm") ?? ""));
  if (errors.password || errors.confirm) {
    return {
      fieldErrors: {
        password: errors.password && t.validation[errors.password],
        confirm: errors.confirm && t.validation[errors.confirm],
      },
    };
  }

  // Hash first: scrypt is slow and must not hold a transaction open.
  const { hash, salt } = await hashPassword(password);
  const userId = await prisma.$transaction(async (tx) => {
    const row = await consumeToken(tx, token, ["reset"]);
    if (!row) return null;
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash: hash, passwordSalt: salt, failedLoginAttempts: 0, lockedUntil: null },
    });
    await tx.session.deleteMany({ where: { userId: row.userId } });
    await tx.userToken.deleteMany({ where: { userId: row.userId, purpose: "reset" } });
    return row.userId;
  });
  if (!userId) return { invalid: true };

  logEvent("password_reset", { userId });
  redirect("/login?notice=passwordReset");
}
