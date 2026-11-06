// Run: npx tsx src/lib/user-validation.check.ts
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validateNewPassword,
  validateProfile,
} from "./user-validation";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
assert(normalizeEmail("  Ana@X.com ") === "ana@x.com", "normalizes email");
assert(validateEmail("ana@x.com").error === undefined, "valid email");
assert(validateEmail("ana@x").error === "invalidEmail", "needs a dot in the domain");
assert(validateEmail("a b@x.com").error === "invalidEmail", "no spaces");
assert(validateEmail("   ").error === "required", "blank email");
assert(validateEmail(`${"a".repeat(250)}@x.com`).error === "invalidEmail", "email over 254");
assert(validateName("  Ana ").value === "Ana", "trims names");
assert(validateName("   ").error === "required", "blank name");
assert(validateName("a".repeat(100)).error === undefined, "100 is allowed");
assert(validateName("a".repeat(101)).error === "tooLong", "101 is too long");
const p = validateProfile({ name: "", lastName: "L", email: "bad" });
assert(p.errors.name === "required" && p.errors.email === "invalidEmail" && !p.errors.lastName, "profile errors");
assert(validateNewPassword("a".repeat(11), "a".repeat(11)).password === "passwordLength", "too short");
assert(validateNewPassword("a".repeat(129), "a".repeat(129)).password === "passwordLength", "too long");
assert(Object.keys(validateNewPassword("a".repeat(12), "a".repeat(12))).length === 0, "12 ok, no complexity rules");
assert(validateNewPassword("a".repeat(12), "b".repeat(12)).confirm === "passwordMismatch", "mismatch");
console.log("user-validation ok");
