"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { getTranslations } from "@/i18n/get-locale";
import { normalizeEmail } from "@/lib/user-validation";
import { withMinimumDuration } from "@/lib/timing";
import { logEvent } from "@/lib/log";
import { isLoginLocked, loginAttemptReservation } from "@/lib/login-attempts";

export type ActionState = { error?: string; pendingEmail?: string; values?: { email: string } } | undefined;

// Unknown emails and locked accounts still pay for one scrypt run, so response time doesn't reveal which emails exist.
const dummyCredential = hashPassword(randomBytes(16).toString("hex"));

export async function loginWithPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { t } = await getTranslations();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const values = { email: String(formData.get("email") ?? "") };

  if (!email || !password) return { error: t.auth.errors.invalidCredentials, values };

  return withMinimumDuration(1500, async () => {
    let user = await prisma.user.findUnique({ where: { email } });
    let reserved = false;
    for (let attempt = 0; user && attempt < 3; attempt++) {
      const now = new Date();
      // Expired lockouts start a fresh window, with the reset itself conditional.
      const cleared = await prisma.user.updateMany({
        where: { id: user.id, lockedUntil: { lt: now } },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      if (cleared.count) user = await prisma.user.findUnique({ where: { email } });
      const reservation = loginAttemptReservation(user, now);
      if (!user || !reservation) break;
      const { count } = await prisma.user.updateMany({
        where: {
          id: user.id, failedLoginAttempts: user.failedLoginAttempts,
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        },
        data: reservation,
      });
      if (count) { reserved = true; break; }
      user = await prisma.user.findUnique({ where: { email } });
    }
    const locked = isLoginLocked(user, new Date());
    let valid = false;
    if (user?.passwordHash && user.passwordSalt && reserved) {
      valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    } else {
      const dummy = await dummyCredential;
      await verifyPassword(password, dummy.hash, dummy.salt);
    }

    if (!valid) {
      console.warn(JSON.stringify({ event: "login_failed", email, locked }));
      return { error: t.auth.errors.invalidCredentials, values };
    }

    const outcome = await prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id: user!.id, passwordHash: user!.passwordHash },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      if (!count) return "changed";
      // Re-read under the row lock: confirmation may have finished while scrypt ran.
      const current = await tx.user.findUniqueOrThrow({ where: { id: user!.id } });
      if (!current.emailVerifiedAt) return "pending";
      await createSession(current.id, tx);
      return "signedIn";
    });
    if (outcome === "changed") return { error: t.auth.errors.invalidCredentials, values };
    if (outcome === "pending") {
      return { error: t.auth.errors.emailNotConfirmed, pendingEmail: user!.email, values };
    }
    logEvent("login", { userId: user!.id });
    await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    redirect("/");
  });
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
