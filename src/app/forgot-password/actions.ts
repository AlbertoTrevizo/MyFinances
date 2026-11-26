"use server";

import { prisma } from "@/lib/prisma";
import { getTranslations } from "@/i18n/get-locale";
import { createToken } from "@/lib/user-tokens";
import { reserveEmailSlot, releaseEmailSlot } from "@/lib/email";
import { withEmailSlot } from "@/lib/email-reservation";
import { sendAccountEmail } from "@/lib/account-emails";
import { sendConfirmation } from "@/lib/account-flows";
import { normalizeEmail } from "@/lib/user-validation";
import { withMinimumDuration } from "@/lib/timing";
import { logEvent } from "@/lib/log";
import { recoveryEmailKind } from "@/lib/user-status";

export type ForgotState = { sent?: boolean; error?: string; values?: { email: string } } | undefined;

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const { t } = await getTranslations();
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  const result = await withMinimumDuration(1500, async () => {
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!user) return "sent" as const;
    if (recoveryEmailKind(user) === "confirm") return sendConfirmation(user, t);
    return withEmailSlot(
      () => reserveEmailSlot(user.email),
      async (slot) => {
        const token = await createToken("reset", async () => user.id);
        logEvent("reset_requested", { userId: user.id });
        return sendAccountEmail("reset", user.email, t, token!, slot);
      },
      releaseEmailSlot,
    );
  });

  const values = { email: String(formData.get("email") ?? "") };

  // RF-13: the one case where the answer can differ.
  return result === "failed" ? { error: t.forgotPassword.failed, values } : { sent: true };
}
