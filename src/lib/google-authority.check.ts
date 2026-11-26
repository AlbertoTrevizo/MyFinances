import assert from "node:assert/strict";
import { isGoogleAuthoritative } from "./google-authority";

assert.equal(isGoogleAuthoritative("owner@gmail.com"), true);
assert.equal(isGoogleAuthoritative("owner@googlemail.com"), true);
assert.equal(isGoogleAuthoritative(" Owner@GMAIL.COM "), true);
assert.equal(isGoogleAuthoritative("owner@company.com", "company.com"), true);
assert.equal(isGoogleAuthoritative("owner@COMPANY.com", "COMPANY.COM"), true);
for (const hd of [undefined, "", "other.com", "sub.company.com", "company.com.attacker.com"]) {
  assert.equal(isGoogleAuthoritative("owner@company.com", hd), false, `S6: reject mismatched hd ${hd}`);
}
for (const email of ["", "gmail.com", "@gmail.com", "a@@gmail.com", "a@", "a@gmail.com.attacker.com", "a@notgmail.com"]) {
  assert.equal(isGoogleAuthoritative(email), false, `S6: reject ${email}`);
}
console.log("google-authority ok");
