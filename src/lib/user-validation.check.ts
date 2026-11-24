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
assert(normalizeEmail("  Ana@X.com ") === "ana@x.com", "RF-3: normalizes email case and surrounding whitespace");
const email = validateEmail("  Ana@X.com ");
assert(email.error === undefined && email.value === "ana@x.com", "RF-3: validates the normalized email");
for (const invalid of ["ana@x", "a b@x.com", "a@@x.com", "@x.com", "ana@", "ana.x.com"]) {
  assert(validateEmail(invalid).error === "invalidEmail", `RF-3: rejects malformed email ${invalid}`);
}
assert(validateEmail("   ").error === "required", "RF-3: blank email is required");
// RF-3 defines email validation; the existing helper also caps its length at 254.
const emailPrefix = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.`;
assert(validateEmail(emailPrefix + "d".repeat(61)).error === undefined, "RF-3: current email helper accepts exactly 254 characters");
assert(validateEmail(emailPrefix + "d".repeat(62)).error === "invalidEmail", "RF-3: current email helper rejects 255 characters");
assert(validateName("  Ana ").value === "Ana", "RF-3: trims names");
assert(validateName("   ").error === "required", "RF-3: whitespace-only name is required");
assert(validateName("").error === "required", "RF-3: empty name is required");
const maxName = validateName(` ${"a".repeat(100)} `);
assert(maxName.error === undefined && maxName.value.length === 100, "RF-3: 100 characters after trimming are allowed");
assert(validateName("a".repeat(101)).error === "tooLong", "RF-3: 101 characters are too long");
const p = validateProfile({ name: "", lastName: "L", email: "bad" });
assert(p.errors.name === "required" && p.errors.email === "invalidEmail" && !p.errors.lastName, "RF-3: profile reports errors per field");
for (const [lastName, error] of [["  ", "required"], ["a".repeat(101), "tooLong"]] as const) {
  const profile = validateProfile({ name: "Ana", lastName, email: "ana@x.com" });
  assert(profile.errors.lastName === error && Object.keys(profile.errors).length === 1, `RF-3: validates last name with ${error}`);
}
const profile = validateProfile({ name: " Ana ", lastName: ` ${"L".repeat(100)} `, email: " Ana@X.com " });
assert(Object.keys(profile.errors).length === 0, "RF-3: valid profile has no errors");
assert(profile.values.name === "Ana" && profile.values.lastName === "L".repeat(100) && profile.values.email === "ana@x.com", "RF-3: returns normalized profile values, including the maximum last name");
for (const length of [11, 129]) {
  const password = "a".repeat(length);
  assert(validateNewPassword(password, password).password === "passwordLength", `RF-3: rejects password length ${length}`);
}
for (const length of [12, 128]) {
  const password = "a".repeat(length);
  assert(Object.keys(validateNewPassword(password, password)).length === 0, `RF-3: accepts password length ${length} without complexity rules`);
}
assert(validateNewPassword("a".repeat(12), "b".repeat(12)).confirm === "passwordMismatch", "RF-2: mismatching confirmation is rejected");
console.log("user-validation ok");
