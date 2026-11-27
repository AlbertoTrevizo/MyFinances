// Run: node --import tsx src/app/books/actions.check.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import ts from "typescript";
import { Prisma } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { withEmailSlot, type SendResult, type EmailReservation } from "../../lib/email-reservation";
import * as validation from "../../lib/user-validation";
import { deleteBook as deleteBookData } from "../../lib/book-data";
import * as rules from "../../lib/book-rules";
import en from "../../i18n/dictionaries/en";
import type * as Actions from "./actions";

const compiled = ts.transpileModule(readFileSync("src/app/books/actions.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ userId = "owner", ownerId = "owner", member = true, code = "", emailMember = false, sendResult = "sent" as SendResult, reservation = { id: "slot" } as EmailReservation, base = "https://example.com", sendThrows = false } = {}) {
  const writes: string[] = [];
  const events: { event: string; data: Record<string, unknown> }[] = [];
  let role = "editor";
  let authenticated = false;
  const invitations = [{ id: "old", bookId: "book", email: "guest@example.com", tokenHash: "old-hash", role: "viewer", expiresAt: new Date(Date.now() + 100000) }];
  const delivered: string[] = [];
  const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
  const db = {
    book: {
      findFirst: async ({ where }: { where: { id: string; ownerId?: string; OR?: unknown } }) => {
        assert.ok(authenticated);
        assert.equal(where.id, "book");
        if (where.ownerId !== undefined) return where.ownerId === ownerId ? { id: "book" } : null;
        return !where.OR || userId === ownerId || member ? { id: "book" } : null;
      },
      findUnique: async () => ({ ownerId }),
      create: async ({ data }: { data: { name: string; ownerId: string } }) => {
        assert.deepEqual(data, { name: "Home", ownerId: userId });
        writes.push("create");
        return { id: "book" };
      },
      updateMany: async ({ where }: { where: { id: string; ownerId: string } }) => {
        assert.equal(where.id, "book");
        if (where.ownerId !== ownerId) return { count: 0 };
        writes.push("rename");
        return { count: 1 };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        assert.equal(where.id, "book");
        writes.push("delete");
      },
    },
    bookMember: {
      findUnique: async ({ where }: { where: { bookId_userId: { bookId: string; userId: string } } }) => {
        assert.deepEqual(where.bookId_userId, { bookId: "book", userId: "member" });
        return member ? { id: "membership", role } : null;
      },
      update: async ({ data }: { data: { role: string } }) => { role = data.role; writes.push("role"); },
      deleteMany: async ({ where }: { where: { bookId: string; userId: string } }) => {
        assert.equal(where.bookId, "book");
        assert.notEqual(where.userId, ownerId, "the owner must never be removed");
        if (!member) return { count: 0 };
        writes.push("remove");
        return { count: 1 };
      },
    },
    user: {
      findFirst: async ({ where }: { where: { email: { equals: string; mode: string }; OR: unknown } }) => {
        assert.ok(authenticated);
        assert.equal(where.email.mode, "insensitive");
        assert.deepEqual(where.OR, [{ id: userId }, { memberships: { some: { bookId: "book" } } }]);
        return emailMember || where.email.equals === "owner@example.com" ? { id: "existing" } : null;
      },
      update: async ({ where, data }: { where: { id: string }; data: { activeBookId: string } }) => {
        assert.deepEqual(where, { id: userId });
        assert.deepEqual(data, { activeBookId: "book" });
        writes.push("active");
      },
    },
    bookInvitation: {
      create: async ({ data }: { data: typeof invitations[number] }) => {
        assert.ok(authenticated);
        assert.equal(data.bookId, "book");
        assert.match(data.tokenHash, /^[0-9a-f]{64}$/);
        assert.ok(Math.abs(data.expiresAt.getTime() - Date.now() - 7 * 86400000) < 1000);
        assert.ok(data.role === "viewer" || data.role === "editor");
        const row = { ...data, id: "new" };
        invitations.push(row);
        writes.push("invite");
        return row;
      },
      deleteMany: async ({ where }: { where: { bookId?: string; email?: string; id: string | { not: string } } }) => {
        const before = invitations.length;
        for (let i = invitations.length - 1; i >= 0; i--) {
          const row = invitations[i];
          if ((!where.bookId || row.bookId === where.bookId) && (!where.email || row.email === where.email)
            && (typeof where.id === "string" ? row.id === where.id : row.id !== where.id.not)) invitations.splice(i, 1);
        }
        writes.push("revoke");
        return { count: before - invitations.length };
      },
    },
  };
  const prisma = {
    ...db,
    $transaction: async (run: (tx: typeof db) => Promise<unknown>, options?: { isolationLevel: string }) => {
      assert.ok(authenticated);
      if (code) throw new Prisma.PrismaClientKnownRequestError("test conflict", { code, clientVersion: "test" });
      const result = await run(db);
      if (!writes.includes("create")) assert.equal(options?.isolationLevel, "Serializable");
      return result;
    },
  };
  const exports = {} as typeof Actions;
  const modules: Record<string, unknown> = {
    "@prisma/client": { Prisma },
    "crypto": { randomBytes },
    "@/lib/user-validation": validation,
    "@/lib/email-reservation": { withEmailSlot },
    "@/lib/email": {
      reserveEmailSlot: async (email: string) => { assert.equal(email, "guest@example.com"); return reservation; },
      releaseEmailSlot: async () => { writes.push("release"); },
    },
    "@/lib/account-emails": { sendAccountEmail: async (kind: string, email: string, t: unknown, token: string, slot: unknown) => {
      assert.equal(kind, "invitation");
      assert.equal(email, "guest@example.com");
      assert.equal(t, en);
      assert.deepEqual(slot, { id: "slot" });
      assert.match(token, /^[0-9a-f]{64}$/);
      assert.equal(invitations.find((row) => row.id === "new")?.tokenHash, hashToken(token));
      delivered.push(token);
      if (sendThrows) throw new Error("transport");
      return sendResult;
    } },
    "@/lib/app-url": { appUrl: () => base || null },
    "next/cache": { revalidatePath: (path: string, type: string) => {
      assert.equal(path, "/");
      assert.equal(type, "layout");
    } },
    "next/navigation": {
      notFound: () => { throw new Error("404"); },
      redirect: (path: string) => { throw new Error(`redirect:${path}`); },
    },
    "@/i18n/get-locale": { getTranslations: async () => ({ t: en }) },
    "@/lib/book-data": { deleteBook: deleteBookData },
    "@/lib/book-rules": rules,
    "@/lib/log": { logEvent: (event: string, data: Record<string, unknown>) => events.push({ event, data }) },
    "@/lib/prisma": { prisma },
    "@/lib/session": { hashToken, requireUser: async () => { authenticated = true; return { id: userId, role: "admin" }; } },
  };
  runInThisContext(`(function(exports, require) { ${compiled}\n})`)(exports, (id: string) => {
    assert.ok(id in modules, `unexpected import: ${id}`);
    return modules[id];
  });
  return { actions: exports, writes, events, invitations, delivered, hashToken };
}

const form = (key: string, value: string) => {
  const data = new FormData();
  data.set(key, value);
  return data;
};

async function check() {
  let ctx = setup();
  assert.equal((await ctx.actions.createBook(undefined, form("name", " ")))?.error, en.books.errors.required);
  assert.deepEqual(ctx.writes, []);
  await assert.rejects(ctx.actions.createBook(undefined, form("name", " Home ")), /redirect:\/$/);
  assert.deepEqual(ctx.writes, ["create", "active"]);
  assert.equal(ctx.events[0].event, "book_created");

  ctx = setup({ userId: "stranger", member: false });
  await assert.rejects(ctx.actions.setActiveBook("book"), /404/);
  await assert.rejects(ctx.actions.renameBook("book", undefined, form("name", "Home")), /404/);
  await assert.rejects(ctx.actions.deleteBook("book"), /404/);
  await assert.rejects(ctx.actions.removeMember("book", "member"), /404/);
  await assert.rejects(ctx.actions.setMemberRole("book", "member", undefined, form("role", "viewer")), /404/);
  assert.equal((await ctx.actions.leaveBook("book"))?.error, en.books.errors.notFound);
  assert.deepEqual(ctx.writes, [], "nonmembers cannot change books, even with an explicit id");

  ctx = setup({ userId: "member" });
  await ctx.actions.setActiveBook("book");
  await assert.rejects(ctx.actions.renameBook("book", undefined, form("name", "Home")), /404/);
  await assert.rejects(ctx.actions.deleteBook("book"), /404/);
  await assert.rejects(ctx.actions.removeMember("book", "member"), /404/);
  await assert.rejects(ctx.actions.setMemberRole("book", "member", undefined, form("role", "viewer")), /404/);
  await assert.rejects(ctx.actions.leaveBook("book"), /redirect:\/books/);
  assert.deepEqual(ctx.writes, ["active", "remove"]);
  assert.equal(ctx.events[0].event, "book_member_left");

  ctx = setup();
  assert.equal((await ctx.actions.leaveBook("book"))?.error, en.books.errors.ownerCannotLeave);
  await assert.rejects(ctx.actions.removeMember("book", "owner"), /404/);
  assert.equal((await ctx.actions.setMemberRole("book", "member", undefined, form("role", "owner")))?.error, en.books.errors.invalidRole);
  assert.deepEqual(ctx.writes, [], "owner cannot leave, be removed, or assign ownership");
  await ctx.actions.setMemberRole("book", "member", undefined, form("role", "editor"));
  assert.equal(ctx.events.length, 0, "unchanged roles must not produce audit events");
  await ctx.actions.setMemberRole("book", "member", undefined, form("role", "viewer"));
  assert.deepEqual(ctx.events[0], {
    event: "book_member_role_changed",
    data: { bookId: "book", userId: "member", by: "owner", from: "editor", to: "viewer" },
  });
  await ctx.actions.removeMember("book", "member");
  await ctx.actions.renameBook("book", undefined, form("name", " Home "));
  await assert.rejects(ctx.actions.deleteBook("book"), /redirect:\/books/);
  assert.deepEqual(ctx.writes, ["role", "remove", "rename", "delete"]);
  assert.deepEqual(ctx.events.map(({ event }) => event), ["book_member_role_changed", "book_member_removed", "book_deleted"]);

  ctx = setup({ member: false });
  assert.equal((await ctx.actions.setMemberRole("book", "member", undefined, form("role", "viewer")))?.error, en.books.errors.notFound);
  assert.equal((await ctx.actions.removeMember("book", "member"))?.error, en.books.errors.notFound);
  assert.deepEqual(ctx.writes, []);

  for (const code of ["P2034", "P2025"]) {
    ctx = setup({ code });
    for (const action of [
      () => ctx.actions.deleteBook("book"),
      () => ctx.actions.removeMember("book", "member"),
      () => ctx.actions.leaveBook("book"),
      () => ctx.actions.setMemberRole("book", "member", undefined, form("role", "viewer")),
    ]) {
      assert.equal((await action())?.error, code === "P2034" ? en.books.errors.conflict : en.books.errors.notFound);
    }
    assert.deepEqual(ctx.writes, []);
    assert.deepEqual(ctx.events, [], "failed transactions must not log success");
  }
  const inviteForm = form("email", " Guest@Example.com ");
  inviteForm.set("role", "editor");
  for (const userId of ["stranger", "member"]) {
    ctx = setup({ userId });
    await assert.rejects(ctx.actions.inviteByEmail("book", undefined, inviteForm), /404/);
    await assert.rejects(ctx.actions.createInviteLink("book", undefined, inviteForm), /404/);
    await assert.rejects(ctx.actions.revokeInvitation("book", "old"), /404/);
    assert.deepEqual(ctx.writes, [], "only the owner may manage invitations");
  }
  ctx = setup({ emailMember: true });
  assert.deepEqual(await ctx.actions.inviteByEmail("book", undefined, inviteForm), { error: en.books.errors.alreadyMember });
  assert.deepEqual(ctx.writes, []);
  ctx = setup();
  const ownerForm = form("email", " OWNER@example.com ");
  ownerForm.set("role", "viewer");
  assert.deepEqual(await ctx.actions.inviteByEmail("book", undefined, ownerForm), { error: en.books.errors.alreadyMember });
  assert.deepEqual(ctx.writes, []);

  for (const reservation of ["limited", "failed"] as const) {
    ctx = setup({ reservation });
    assert.deepEqual(await ctx.actions.inviteByEmail("book", undefined, inviteForm), { error: en.books.errors[reservation] });
    assert.deepEqual(ctx.writes, [], "no invitation is created without an email slot");
    assert.equal(ctx.invitations[0].id, "old");
  }
  for (const sendResult of ["failed", "limited"] as const) {
    ctx = setup({ sendResult });
    assert.deepEqual(await ctx.actions.inviteByEmail("book", undefined, inviteForm), { error: en.books.errors[sendResult] });
    assert.deepEqual(ctx.invitations.map((row) => row.id), ["old"], "a failed send removes only the new invitation");
    assert.deepEqual(ctx.writes, ["invite", "revoke", "release"]);
    assert.equal(ctx.events.length, 0);
  }
  ctx = setup({ sendThrows: true });
  assert.deepEqual(await ctx.actions.inviteByEmail("book", undefined, inviteForm), { error: en.books.errors.failed });
  assert.deepEqual(ctx.invitations.map((row) => row.id), ["old"]);

  ctx = setup();
  assert.deepEqual(await ctx.actions.inviteByEmail("book", undefined, inviteForm), { ok: true });
  assert.deepEqual(ctx.invitations.map((row) => row.id), ["new"], "sent email replaces older invitations");
  assert.equal(ctx.invitations[0].email, "guest@example.com");
  assert.equal(ctx.invitations[0].role, "editor");
  assert.notEqual(ctx.invitations[0].tokenHash, ctx.delivered[0], "store only the token hash");
  assert.deepEqual(ctx.events[0], { event: "book_invitation_created", data: { bookId: "book", by: "owner", kind: "email" } });
  assert.ok(!JSON.stringify(ctx.events).includes(ctx.delivered[0]));

  ctx = setup({ base: "" });
  assert.deepEqual(await ctx.actions.createInviteLink("book", undefined, inviteForm), { error: en.books.errors.failed });
  assert.deepEqual(ctx.writes, []);
  ctx = setup();
  assert.deepEqual(await ctx.actions.inviteByEmail("book", undefined, form("email", "bad")), { error: en.validation.invalidEmail });
  assert.deepEqual(await ctx.actions.createInviteLink("book", undefined, form("role", "owner")), { error: en.books.errors.invalidRole });
  assert.deepEqual(ctx.writes, []);
  const link = await ctx.actions.createInviteLink("book", undefined, inviteForm);
  assert.equal(link?.ok, true);
  const url = new URL(link!.url!);
  assert.equal(url.origin, "https://example.com");
  assert.equal(url.pathname, "/invitations");
  const token = url.searchParams.get("token")!;
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(ctx.invitations[1].tokenHash, ctx.hashToken(token));
  assert.notEqual(ctx.invitations[1].tokenHash, token);
  assert.equal(ctx.invitations[1].email, null);
  assert.equal(ctx.invitations[1].role, "editor");
  assert.equal(ctx.events[0].data.kind, "link");
  assert.ok(!JSON.stringify(ctx.events).includes(token));
  await ctx.actions.revokeInvitation("book", "new");
  assert.deepEqual(ctx.invitations.map((row) => row.id), ["old"]);
  assert.equal(ctx.events[1].event, "book_invitation_revoked");
  console.log("book actions ok");
}
void check();
