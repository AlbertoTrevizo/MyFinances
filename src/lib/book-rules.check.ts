// Run: node --import tsx src/lib/book-rules.check.ts
import { strict as assert } from "node:assert";
import {
  type BookAccess,
  canWrite,
  canManage,
  parseMemberRole,
  validateBookName,
  pickActiveBook,
  pickNewOwner,
  invitationDecision,
  invitationReturnPath,
} from "./book-rules";

for (const access of ["owner", "editor", "viewer"] as const) {
  assert.equal(canWrite(access), access !== "viewer", `write permission: ${access}`);
  assert.equal(canManage(access), access === "owner", `manage permission: ${access}`);
}
for (const role of ["editor", "viewer"] as const) {
  assert.equal(parseMemberRole(role), role, `valid member role: ${role}`);
}
for (const value of ["owner", "", "Editor", " viewer ", null, undefined, 0, true, {}, [], ["editor"]]) {
  assert.equal(parseMemberRole(value), null, `invalid member role: ${JSON.stringify(value)}`);
}
assert.deepEqual(validateBookName(""), { error: "required" }, "empty name");
assert.deepEqual(validateBookName(" \t\n "), { error: "required" }, "whitespace name");
assert.deepEqual(validateBookName("  Home  "), { name: "Home" }, "trimmed name");
assert.deepEqual(validateBookName(` ${"a".repeat(100)} `), { name: "a".repeat(100) }, "100 character name");
assert.deepEqual(validateBookName("a".repeat(101)), { error: "tooLong" }, "101 character name");

const oldest = new Date("2026-01-01T00:00:00Z");
const middle = new Date("2026-02-01T00:00:00Z");
const newest = new Date("2026-03-01T00:00:00Z");
const books: { id: string; access: BookAccess; joinedAt: Date }[] = [
  { id: "new-owner", access: "owner", joinedAt: newest },
  { id: "viewer", access: "viewer", joinedAt: oldest },
  { id: "old-owner", access: "owner", joinedAt: middle },
];
assert.equal(pickActiveBook("viewer", books), "viewer", "remembered member beats owned book");
assert.equal(pickActiveBook("new-owner", books), "new-owner", "remembered owner beats older owner");
assert.equal(pickActiveBook("foreign", books), "old-owner", "foreign remembered book falls back to oldest owner");
assert.equal(pickActiveBook(null, books), "old-owner", "oldest owned book beats older membership");
assert.equal(pickActiveBook(null, [
  { id: "editor", access: "editor", joinedAt: newest },
  books[1],
]), "viewer", "oldest membership without owned books");
assert.equal(pickActiveBook("deleted", []), null, "no remaining books");
assert.equal(pickActiveBook(null, []), null, "no books or remembered book");
assert.equal(books[0].id, "new-owner", "book selection preserves input order");

const members: { userId: string; role: "editor" | "viewer"; createdAt: Date }[] = [
  { userId: "new-editor", role: "editor", createdAt: newest },
  { userId: "viewer", role: "viewer", createdAt: oldest },
  { userId: "old-editor", role: "editor", createdAt: middle },
];
assert.equal(pickNewOwner(members), "old-editor", "oldest editor wins; older viewer is ineligible");
assert.equal(pickNewOwner([members[1]]), null, "viewers cannot become owners");
assert.equal(pickNewOwner([]), null, "no members to inherit book");
assert.equal(members[0].userId, "new-editor", "owner selection preserves input order");

const invitationInput = {
  invitation: { email: "guest@example.com", expiresAt: newest },
  now: middle,
  userEmail: "guest@example.com",
  access: null,
};
assert.equal(invitationDecision({ ...invitationInput, invitation: null }), "invalid", "missing, used or revoked invitation");
assert.equal(invitationDecision({
  ...invitationInput,
  invitation: { email: "other@example.com", expiresAt: oldest },
  access: "owner",
}), "invalid", "expired invitation takes precedence over account and access");
assert.equal(invitationDecision({
  ...invitationInput,
  invitation: { email: null, expiresAt: middle },
}), "invalid", "invitation expires exactly at now");
assert.equal(invitationDecision({ ...invitationInput, userEmail: "other@example.com" }), "wrongAccount", "invitation for another email");
assert.equal(invitationDecision({ ...invitationInput, userEmail: "other@example.com", access: "editor" }), "wrongAccount", "wrong account takes precedence over membership");
assert.equal(invitationDecision(invitationInput), "accept", "matching email invitation");
assert.equal(invitationDecision({
  ...invitationInput,
  invitation: { email: "Guest@Example.com", expiresAt: newest },
  userEmail: "GUEST@example.COM",
}), "accept", "email comparison is case-insensitive");
assert.equal(invitationDecision({
  ...invitationInput,
  invitation: { email: null, expiresAt: newest },
}), "accept", "link invitation accepts any email");
for (const access of ["owner", "editor", "viewer"] as const) {
  assert.equal(invitationDecision({
    ...invitationInput,
    invitation: { email: null, expiresAt: newest },
    access,
  }), "alreadyMember", `existing access, including owner opening own link: ${access}`);
}

const returnPath = `/invitations?token=${"0123456789abcdef".repeat(4)}`;
assert.equal(invitationReturnPath(returnPath), returnPath, "valid invitation return path");
for (const value of [
  "/invitations?token=abc",
  returnPath.toUpperCase(),
  `/invitations?token=${"A".repeat(64)}`,
  "//evil.com",
  `https://evil.com${returnPath}`,
  `${returnPath}&next=//evil.com`,
  `${returnPath}a`,
  "",
  undefined,
]) {
  assert.equal(invitationReturnPath(value), null, `invalid invitation return path: ${value}`);
}
console.log("book-rules ok");
