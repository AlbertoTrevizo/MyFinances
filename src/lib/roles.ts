export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function parseRole(value: unknown): Role | null {
  return value === "user" || value === "admin" ? value : null;
}

export function isAdmin(user: { role: Role }): boolean {
  return user.role === "admin";
}

export function removesLastAdmin(targetRole: Role, adminCount: number): boolean {
  return targetRole === "admin" && adminCount <= 1;
}

export function roleChangeError({
  targetConfirmed,
  from,
  to,
  adminCount,
}: {
  targetConfirmed: boolean;
  from: Role;
  to: Role;
  adminCount: number;
}): "lastAdmin" | "pendingAdmin" | null {
  if (from === to) return null;
  if (to === "user" && removesLastAdmin(from, adminCount)) return "lastAdmin";
  if (to === "admin" && !targetConfirmed) return "pendingAdmin";
  return null;
}
