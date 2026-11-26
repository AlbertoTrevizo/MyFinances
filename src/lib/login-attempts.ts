const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function isLoginLocked(user: { lockedUntil: Date | null } | null, now: Date): boolean {
  return Boolean(user?.lockedUntil && user.lockedUntil > now);
}

// The database compares the old count before applying this reservation.
export function loginAttemptReservation(
  user: { failedLoginAttempts: number; lockedUntil: Date | null } | null,
  now: Date,
): { failedLoginAttempts: number; lockedUntil: Date | undefined } | null {
  if (!user || isLoginLocked(user, now)) return null;
  const failedLoginAttempts = user.failedLoginAttempts + 1;
  return {
    failedLoginAttempts,
    lockedUntil: failedLoginAttempts >= MAX_FAILED_ATTEMPTS ? loginLockoutUntil(now) : undefined,
  };
}

export function loginLockoutUntil(now: Date): Date {
  return new Date(now.getTime() + LOCKOUT_MS);
}
