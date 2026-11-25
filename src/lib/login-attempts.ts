const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function isLoginLocked(user: { lockedUntil: Date | null } | null, now: Date): boolean {
  return Boolean(user?.lockedUntil && user.lockedUntil > now);
}

export function shouldLockLogin(
  user: { failedLoginAttempts: number } | null,
  locked: boolean,
): boolean {
  return Boolean(user && !locked && user.failedLoginAttempts + 1 >= MAX_FAILED_ATTEMPTS);
}

export function loginLockoutUntil(now: Date): Date {
  return new Date(now.getTime() + LOCKOUT_MS);
}
