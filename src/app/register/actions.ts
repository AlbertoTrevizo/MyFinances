"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getTranslations } from "@/i18n/get-locale";
import { createToken } from "@/lib/user-tokens";
import { reserveEmailSlot, releaseEmailSlot } from "@/lib/email";
import { withEmailSlot } from "@/lib/email-reservation";
import { sendAccountEmail } from "@/lib/account-emails";
import { validateNewPassword, validateProfile } from "@/lib/user-validation";
import { withMinimumDuration } from "@/lib/timing";
import { logEvent } from "@/lib/log";

type Field = "name" | "lastName" | "email" | "password" | "confirm";
export type RegisterState =
  | {
      fieldErrors?: Partial<Record<Field, string>>;
      values?: { name: string; lastName: string; email: string };
      sent?: boolean;
      sendFailedEmail?: string;
    }
  | undefined;

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const { t } = await getTranslations();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const { values, errors } = validateProfile({
    name: String(formData.get("name") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  const allErrors = { ...errors, ...validateNewPassword(password, confirm) };
  if (Object.keys(allErrors).length > 0) {
    const fieldErrors: Partial<Record<Field, string>> = {};
    for (const [field, code] of Object.entries(allErrors)) {
      fieldErrors[field as Field] = t.validation[code];
    }
    return { fieldErrors, values };
  }

  // Same response and similar timing whether or not the email already has an account (RNF-1).
  return withMinimumDuration(1500, async () => {
    const { hash, salt } = await hashPassword(password);
    const find = () => prisma.user.findUnique({ where: { email: values.email } });
    let existing = await find();
    let userId: string | null = null;
    if (!existing) {
      try {
        const user = await prisma.user.create({
          data: { ...values, passwordHash: hash, passwordSalt: salt, ownedBooks: { create: { name: t.books.defaultName } } },
        });
        userId = user.id;
        logEvent("registration", { userId });
      } catch (error) {
        // A simultaneous registration won the race: continue as an existing account.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
        existing = await find();
      }
    }
    let accountExistsNotice = false;
    if (existing) {
      userId = existing.id;
      const { count } = await prisma.user.updateMany({
        where: { id: userId, emailVerifiedAt: null },
        data: {
          name: values.name, lastName: values.lastName,
          passwordHash: hash, passwordSalt: salt, passwordReplaced: true,
        },
      });
      accountExistsNotice = count === 0;
      if (count) logEvent("registration_replaced", { userId });
    }
    const result = await withEmailSlot(
      () => reserveEmailSlot(values.email),
      async (slot) => {
        if (accountExistsNotice) return sendAccountEmail("accountExists", values.email, t, undefined, slot);
        const token = await createToken("confirm", async (tx) => {
          // Confirmation may finish between the replacement and the email reservation.
          const { count } = await tx.user.updateMany({
            where: { id: userId!, emailVerifiedAt: null }, data: { emailVerifiedAt: null },
          });
          return count ? userId : null;
        });
        if (!token) {
          accountExistsNotice = true;
          return sendAccountEmail("accountExists", values.email, t, undefined, slot);
        }
        return sendAccountEmail("confirm", values.email, t, token, slot);
      },
      releaseEmailSlot,
    );
    return result === "failed" && !accountExistsNotice ? { sendFailedEmail: values.email } : { sent: true };
  });
}
