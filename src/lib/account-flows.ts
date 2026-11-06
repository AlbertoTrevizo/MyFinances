import { prisma } from "./prisma";
import { sendAccountEmail } from "./account-emails";
import type { SendResult } from "./email";
import { createToken } from "./user-tokens";
import { normalizeEmail } from "./user-validation";
import type { Dictionary } from "@/i18n/dictionaries";

// New confirmation link (annuls the old one) for an account that is still Pending.
export async function sendConfirmation(
  user: { id: string; email: string },
  t: Dictionary
): Promise<SendResult> {
  const token = await createToken(prisma, user.id, "confirm");
  return sendAccountEmail("confirm", user.email, t, token);
}

// Resend by address without revealing whether it exists: only Pending accounts get mail.
export async function resendConfirmationTo(rawEmail: string, t: Dictionary): Promise<SendResult> {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(rawEmail) } });
  if (!user || user.emailVerifiedAt) return "sent";
  return sendConfirmation(user, t);
}
