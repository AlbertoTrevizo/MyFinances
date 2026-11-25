// Run: npx tsx src/lib/user-status.check.ts
import { accountStatus, signInMethod, sortUsers, recoveryEmailKind } from "./user-status";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
assert(recoveryEmailKind(null) === null, "RF-9: unknown email sends no mail");
assert(recoveryEmailKind({ emailVerifiedAt: null }) === "confirm", "RF-9: pending account receives confirmation instead of recovery");
for (const passwordHash of [null, "hash"]) {
  const user = { emailVerifiedAt: new Date("2026-11-24T00:00:00Z"), passwordHash };
  assert(recoveryEmailKind(user) === "reset", "RF-9: confirmed account receives recovery with or without a password");
}

assert(accountStatus({ emailVerifiedAt: null }) === "pending", "pending");
assert(accountStatus({ emailVerifiedAt: new Date() }) === "confirmed", "confirmed");
assert(signInMethod({ passwordHash: "h", googleId: null }) === "email", "email");
assert(signInMethod({ passwordHash: null, googleId: "g" }) === "google", "google");
assert(signInMethod({ passwordHash: "h", googleId: "g" }) === "both", "both");

const rows = [
  { lastName: "Zeta", role: "user", createdAt: new Date(2026, 0, 1) },
  { lastName: null, role: "admin", createdAt: new Date(2026, 0, 3) },
  { lastName: "álvarez", role: "user", createdAt: new Date(2026, 0, 2) },
];
const names = (dir: "asc" | "desc") => sortUsers(rows, "lastName", dir).map((r) => r.lastName);
assert(JSON.stringify(names("asc")) === JSON.stringify(["álvarez", "Zeta", null]), "asc, null last");
assert(JSON.stringify(names("desc")) === JSON.stringify(["Zeta", "álvarez", null]), "desc, null last");
assert(sortUsers(rows, "createdAt", "desc")[0].createdAt.getDate() === 3, "dates desc");
assert(sortUsers(rows, "role", "asc").map((r) => r.role).join() === "admin,user,user", "roles asc");
assert(sortUsers(rows, "role", "desc").map((r) => r.role).join() === "user,user,admin", "roles desc");
console.log("user-status ok");
