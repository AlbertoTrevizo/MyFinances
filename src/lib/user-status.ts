import type { SortDir } from "./sort";

export type AccountStatus = "pending" | "confirmed";
export type SignInMethod = "email" | "google" | "both";

export function accountStatus(user: { emailVerifiedAt: Date | null }): AccountStatus {
  return user.emailVerifiedAt ? "confirmed" : "pending";
}

export function signInMethod(user: {
  passwordHash: string | null;
  googleId: string | null;
}): SignInMethod {
  if (user.passwordHash && user.googleId) return "both";
  return user.googleId ? "google" : "email";
}

type SortValue = string | Date | null | undefined;

// Empty values go last in both directions.
export function sortUsers<T extends object>(
  rows: T[],
  field: keyof T,
  dir: SortDir
): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[field] as SortValue;
    const y = b[field] as SortValue;
    const xEmpty = x == null || x === "";
    const yEmpty = y == null || y === "";
    if (xEmpty || yEmpty) return xEmpty === yEmpty ? 0 : xEmpty ? 1 : -1;
    if (x instanceof Date && y instanceof Date) return sign * (x.getTime() - y.getTime());
    return sign * String(x).localeCompare(String(y));
  });
}
