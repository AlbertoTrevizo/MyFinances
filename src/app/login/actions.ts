"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";

export type ActionState = { error?: string } | undefined;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
// Unknown emails and locked accounts still pay for one scrypt run, so response time doesn't reveal which emails exist.
const dummyCredential = hashPassword(randomBytes(16).toString("hex"));

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
  const locked = Boolean(user?.lockedUntil && user.lockedUntil > new Date());
  let valid = false;
  if (user?.passwordHash && user.passwordSalt && !locked) {
    valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  } else {
    const dummy = await dummyCredential;
    await verifyPassword(password, dummy.hash, dummy.salt);
  }

  if (!valid) {
    console.warn(JSON.stringify({ event: "login_failed", email, locked }));
    // Same single query whether or not the email exists, so timing doesn't reveal it.
    const now = new Date();
    await prisma.user.updateMany({
      where: { email, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
      data: { failedLoginAttempts: { increment: 1 } },
    });
    if (user && !locked && user.failedLoginAttempts + 1 >= MAX_FAILED_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MS) },
      });
    }
    return { error: t.auth.errors.invalidCredentials };
  }

  await prisma.user.update({
    where: { id: user!.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await createSession(user!.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
