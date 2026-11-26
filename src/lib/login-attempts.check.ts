import assert from "node:assert/strict";
import { isLoginLocked, loginAttemptReservation, loginLockoutUntil } from "./login-attempts";

const now = new Date("2026-11-24T12:00:00Z");
assert.equal(isLoginLocked(null, now), false, "RNF-3: unknown account is not locked");
assert.equal(isLoginLocked({ lockedUntil: null }, now), false, "RNF-3: absent lock is inactive");
for (const offset of [-1, 0, 1]) {
  assert.equal(isLoginLocked({ lockedUntil: new Date(now.getTime() + offset) }, now), offset > 0, `RNF-3: lock at offset ${offset} is active only strictly after now`);
}
assert.equal(loginAttemptReservation(null, now), null, "S3: unknown account cannot reserve");
for (const failedLoginAttempts of [0, 1, 2, 3, 4, 5]) {
  const reservation = loginAttemptReservation({ failedLoginAttempts, lockedUntil: null }, now)!;
  assert.equal(reservation.failedLoginAttempts, failedLoginAttempts + 1, "S3: reserve before verifying");
  assert.equal(reservation.lockedUntil?.toISOString(), failedLoginAttempts >= 4 ? "2026-11-24T12:15:00.000Z" : undefined, "S3: fifth reservation locks immediately");
  assert.equal(loginAttemptReservation({ failedLoginAttempts, lockedUntil: new Date(now.getTime() + 1) }, now), null, "S3: locked account cannot reserve or extend its lock");
}
assert.equal(loginAttemptReservation({ failedLoginAttempts: 0, lockedUntil: new Date(now.getTime() - 1) }, now)?.failedLoginAttempts, 1, "S3: cleared expired lock allows a new attempt");
assert.equal(loginLockoutUntil(now).toISOString(), "2026-11-24T12:15:00.000Z", "RNF-3: lock lasts exactly fifteen minutes");
assert.equal(now.toISOString(), "2026-11-24T12:00:00.000Z", "RNF-3: calculating expiry does not change the attempt timestamp");
console.log("login-attempts ok");
