"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";

export type ActionState = { error?: string } | undefined;

export async function loginWithPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: t.auth.errors.invalidCredentials };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !user.passwordSalt) {
    return { error: t.auth.errors.invalidCredentials };
  }

  const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!valid) return { error: t.auth.errors.invalidCredentials };

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
