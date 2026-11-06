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
  { lastName: "Zeta", createdAt: new Date(2026, 0, 1) },
  { lastName: null, createdAt: new Date(2026, 0, 3) },
  { lastName: "álvarez", createdAt: new Date(2026, 0, 2) },
];
const names = (dir: "asc" | "desc") => sortUsers(rows, "lastName", dir).map((r) => r.lastName);
assert(JSON.stringify(names("asc")) === JSON.stringify(["álvarez", "Zeta", null]), "asc, null last");
assert(JSON.stringify(names("desc")) === JSON.stringify(["Zeta", "álvarez", null]), "desc, null last");
assert(sortUsers(rows, "createdAt", "desc")[0].createdAt.getDate() === 3, "dates desc");
console.log("user-status ok");
