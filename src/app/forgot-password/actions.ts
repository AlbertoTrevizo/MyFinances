"use server";

import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";
import { createToken } from "@/lib/user-tokens";
import { sendAccountEmail } from "@/lib/account-emails";
import { sendConfirmation } from "@/lib/account-flows";
import { normalizeEmail } from "@/lib/user-validation";
import { withMinimumDuration } from "@/lib/timing";
import { logEvent } from "@/lib/log";

export type ForgotState = { sent?: boolean; error?: string } | undefined;

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const { t } = await getTranslations();
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  const result = await withMinimumDuration(1500, async () => {
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!user) return "sent" as const;
    if (!user.emailVerifiedAt) return sendConfirmation(user, t);
    const token = await createToken(prisma, user.id, "reset");
    logEvent("reset_requested", { userId: user.id });
    return sendAccountEmail("reset", user.email, t, token);
  });

  // RF-13: the one case where the answer can differ.
  return result === "failed" ? { error: t.forgotPassword.failed } : { sent: true };
}
