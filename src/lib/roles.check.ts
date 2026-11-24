// Run: npx tsx src/lib/roles.check.ts
import { ROLES, parseRole, isAdmin, removesLastAdmin, roleChangeError } from "./roles";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
for (const role of ROLES) assert(parseRole(role) === role, `valid role: ${role}`);
for (const value of ["", "Admin", "USER", "owner", " admin ", null, undefined, 0, true, {}, [], ["admin"]]) {
  assert(parseRole(value) === null, `invalid role: ${JSON.stringify(value)}`);
}
assert(isAdmin({ role: "admin" }), "admin");
assert(!isAdmin({ role: "user" }), "user");
assert(removesLastAdmin("admin", 1), "only admin");
assert(removesLastAdmin("admin", 0), "no admins");
assert(!removesLastAdmin("admin", 2), "two admins");
assert(!removesLastAdmin("user", 1), "target user, one admin");
assert(!removesLastAdmin("user", 2), "target user, two admins");
assert(!removesLastAdmin("user", 0), "target user, no admins");
assert(roleChangeError({ targetConfirmed: true, from: "admin", to: "user", adminCount: 1 }) === "lastAdmin", "last admin demotion");
assert(roleChangeError({ targetConfirmed: true, from: "admin", to: "user", adminCount: 2 }) === null, "valid demotion");
assert(roleChangeError({ targetConfirmed: false, from: "user", to: "admin", adminCount: 1 }) === "pendingAdmin", "pending promotion");
assert(roleChangeError({ targetConfirmed: true, from: "user", to: "admin", adminCount: 1 }) === null, "valid promotion");
assert(roleChangeError({ targetConfirmed: true, from: "admin", to: "admin", adminCount: 1 }) === null, "same admin role");
assert(roleChangeError({ targetConfirmed: false, from: "admin", to: "admin", adminCount: 1 }) === null, "same pending admin role");
assert(roleChangeError({ targetConfirmed: false, from: "user", to: "user", adminCount: 1 }) === null, "same pending user role");
console.log("roles ok");
