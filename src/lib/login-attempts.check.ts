import assert from "node:assert/strict";
import { isLoginLocked, shouldLockLogin, loginLockoutUntil } from "./login-attempts";

const now = new Date("2026-11-24T12:00:00Z");
assert.equal(isLoginLocked(null, now), false, "RNF-3: unknown account is not locked");
assert.equal(isLoginLocked({ lockedUntil: null }, now), false, "RNF-3: absent lock is inactive");
for (const offset of [-1, 0, 1]) {
  assert.equal(isLoginLocked({ lockedUntil: new Date(now.getTime() + offset) }, now), offset > 0, `RNF-3: lock at offset ${offset} is active only strictly after now`);
}
assert.equal(shouldLockLogin(null, false), false, "RNF-3: unknown account cannot be locked");
for (const failedLoginAttempts of [0, 3, 4, 5]) {
  assert.equal(shouldLockLogin({ failedLoginAttempts }, false), failedLoginAttempts >= 4, `RNF-3: failed attempt after ${failedLoginAttempts} previous failures locks at five`);
  assert.equal(shouldLockLogin({ failedLoginAttempts }, true), false, "RNF-3: active lock is never extended by another failed attempt");
}
assert.equal(loginLockoutUntil(now).toISOString(), "2026-11-24T12:15:00.000Z", "RNF-3: lock lasts exactly fifteen minutes");
assert.equal(now.toISOString(), "2026-11-24T12:00:00.000Z", "RNF-3: calculating expiry does not change the attempt timestamp");
console.log("login-attempts ok");
