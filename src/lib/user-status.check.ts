// Run: npx tsx src/lib/user-status.check.ts
import { accountStatus, signInMethod, sortUsers } from "./user-status";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
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
