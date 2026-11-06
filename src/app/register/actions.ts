"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getTranslations } from "@/i18n/get-locale";
import { createToken } from "@/lib/user-tokens";
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
    let token: string | null = null;
    let userId: string | null = null;

    if (!existing) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: { ...values, passwordHash: hash, passwordSalt: salt },
          });
          return { user, token: await createToken(tx, user.id, "confirm") };
        });
        userId = created.user.id;
        token = created.token;
        logEvent("registration", { userId });
      } catch (error) {
        // A simultaneous registration won the race: continue as an existing account.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
          throw error;
        }
        existing = await find();
      }
    }

    if (existing) {
      if (existing.emailVerifiedAt) {
        // No change to the account; failure here stays invisible (RF-13).
        await sendAccountEmail("accountExists", existing.email, t);
        return { sent: true };
      }
      const replaced = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: existing!.id },
          data: { name: values.name, lastName: values.lastName, passwordHash: hash, passwordSalt: salt },
        });
        return createToken(tx, existing!.id, "confirm");
      });
      userId = existing.id;
      token = replaced;
      logEvent("registration_replaced", { userId });
    }

    const result = await sendAccountEmail("confirm", values.email, t, token!);
    return result === "failed" ? { sendFailedEmail: values.email } : { sent: true };
  });
}
