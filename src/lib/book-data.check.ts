// Run: node --import tsx src/lib/book-data.check.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import ts from "typescript";
import { Prisma } from "@prisma/client";
import { resolveOwnedBooks } from "./book-data";
import { removesLastAdmin } from "./roles";
import en from "../i18n/dictionaries/en";
import type * as Actions from "../app/users/actions";

const member = (userId: string, role: "editor" | "viewer", day: number) => ({
  userId, role, createdAt: new Date(Date.UTC(2026, 0, day)),
});

function setup() {
  const books = [
    { id: "editors", ownerId: "owner", members: [member("new", "editor", 3), member("reader", "viewer", 1), member("old", "editor", 2)], invitations: ["email", "link"] },
    { id: "viewers", ownerId: "owner", members: [member("reader", "viewer", 1)], invitations: ["email"] },
    { id: "empty", ownerId: "owner", members: [], invitations: [] },
    { id: "another", ownerId: "owner", members: [member("other-editor", "editor", 4)], invitations: ["link"] },
    { id: "unrelated", ownerId: "someone-else", members: [member("reader", "viewer", 1)], invitations: ["keep"] },
  ];
  const writes: string[] = [];
  const find = (id: string) => {
    const book = books.find((book) => book.id === id);
    assert.ok(book, `book ${id} must exist`);
    return book;
  };
  const db = {
    book: {
      findMany: async ({ where }: { where: { ownerId: string } }) =>
        books.filter((book) => book.ownerId === where.ownerId),
      update: async ({ where, data }: { where: { id: string }; data: { ownerId: string } }) => {
        find(where.id).ownerId = data.ownerId;
        writes.push(`transfer:${where.id}`);
      },
      delete: async ({ where }: { where: { id: string } }) => {
        find(where.id);
        books.splice(books.findIndex((book) => book.id === where.id), 1);
        writes.push(`delete:${where.id}`);
      },
    },
    bookMember: {
      delete: async ({ where }: { where: { bookId_userId: { bookId: string; userId: string } } }) => {
        const { bookId, userId } = where.bookId_userId;
        const book = find(bookId);
        const index = book.members.findIndex((member) => member.userId === userId);
        assert.notEqual(index, -1);
        book.members.splice(index, 1);
        writes.push(`remove:${bookId}:${userId}`);
      },
    },
    bookInvitation: {
      deleteMany: async ({ where }: { where: { bookId: string } }) => {
        find(where.bookId).invitations = [];
        writes.push(`revoke:${where.bookId}`);
      },
    },
  };
  return { books, writes, db, tx: db as unknown as Prisma.TransactionClient };
}

const expectedEvents = [
  { event: "book_transferred", data: { bookId: "editors", from: "owner", to: "old" } },
  { event: "book_deleted", data: { bookId: "viewers", reason: "owner_deleted" } },
  { event: "book_deleted", data: { bookId: "empty", reason: "owner_deleted" } },
  { event: "book_transferred", data: { bookId: "another", from: "owner", to: "other-editor" } },
];

const compiled = ts.transpileModule(readFileSync("src/app/users/actions.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function checkDeleteUser({ missing = false, lastAdmin = false, code = "", adminId = "admin" } = {}) {
  const ctx = setup();
  const before = structuredClone(ctx.books);
  const events: { event: string; data: Record<string, unknown> }[] = [];
  let committed = false;
  let authenticated = false;
  let deleted = false;
  const db = {
    ...ctx.db,
    user: {
      findUnique: async () => missing ? null : { role: lastAdmin ? "admin" : "user" },
      count: async () => 1,
      delete: async ({ where }: { where: { id: string } }) => {
        assert.equal(where.id, "owner");
        assert.ok(ctx.books.every((book) => book.ownerId !== "owner"), "resolve owned books before deleting the user");
        if (code === "P2025") throw new Prisma.PrismaClientKnownRequestError("gone", { code, clientVersion: "test" });
        deleted = true;
      },
    },
  };
  const modules: Record<string, unknown> = {
    "@prisma/client": { Prisma },
    "@/lib/book-data": { resolveOwnedBooks },
    "@/lib/roles": { removesLastAdmin },
    "@/lib/session": { requireAdmin: async () => { authenticated = true; return { id: adminId }; } },
    "@/i18n/get-locale": { getTranslations: async () => ({ t: en }) },
    "@/lib/log": { logEvent: (event: string, data: Record<string, unknown>) => {
      assert.ok(committed, "audit events must follow the commit");
      events.push({ event, data });
    } },
    "next/cache": { revalidatePath: (path: string) => assert.equal(path, "/users") },
    "next/navigation": { redirect: (path: string) => { throw new Error(`redirect:${path}`); } },
    "@/lib/prisma": { prisma: { $transaction: async (run: (tx: typeof db) => Promise<unknown>, options: { isolationLevel: string }) => {
      assert.ok(authenticated);
      assert.equal(options.isolationLevel, "Serializable");
      try {
        const result = await run(db);
        if (code === "P2034") throw new Prisma.PrismaClientKnownRequestError("commit conflict", { code, clientVersion: "test" });
        committed = true;
        return result;
      } catch (error) {
        ctx.books.splice(0, ctx.books.length, ...structuredClone(before));
        deleted = false;
        throw error;
      }
    } } },
  };
  for (const path of ["user-tokens", "email", "email-reservation", "account-emails", "user-validation"]) {
    modules[`@/lib/${path}`] = {};
  }
  const actions = {} as typeof Actions;
  runInThisContext(`(function(exports, require) { ${compiled}\n})`)(actions, (id: string) => {
    assert.ok(id in modules, `unexpected import: ${id}`);
    return modules[id];
  });
  if (adminId === "owner") {
    await assert.rejects(actions.deleteUser("owner"), /redirect:\/login/);
  } else {
    const result = await actions.deleteUser("owner");
    const error = missing || code === "P2025" ? en.users.errors.notFound
      : lastAdmin ? en.users.errors.lastAdmin : code === "P2034" ? en.users.errors.conflict : null;
    assert.deepEqual(result, error ? { error } : undefined);
  }
  if (missing || lastAdmin || code) {
    assert.equal(deleted, false);
    assert.deepEqual(events, [], "failed or rejected deletions must not log book events");
    assert.deepEqual(ctx.books, before);
    if (missing || lastAdmin) assert.deepEqual(ctx.writes, [], "check the last admin before changing books");
  } else {
    assert.equal(deleted, true);
    assert.deepEqual(events, [...expectedEvents, { event: "user_deleted", data: { userId: "owner", by: adminId } }]);
  }
}

async function check() {
  const ctx = setup();
  const unrelated = structuredClone(ctx.books[4]);
  assert.deepEqual(await resolveOwnedBooks(ctx.tx, "owner"), expectedEvents);
  assert.equal(ctx.books[0].ownerId, "old", "the oldest editor becomes owner");
  assert.deepEqual(ctx.books[0].members.map(({ userId }) => userId), ["new", "reader"], "remove the new owner's membership only");
  assert.deepEqual(ctx.books[0].invitations, [], "revoke both email and link invitations");
  assert.ok(!ctx.books.some((book) => book.id === "viewers"), "delete books with only viewers");
  assert.ok(!ctx.books.some((book) => book.id === "empty"), "delete books without members");
  assert.deepEqual(ctx.books[1], { id: "another", ownerId: "other-editor", members: [], invitations: [] });
  assert.deepEqual(ctx.books[2], unrelated, "other owners' books stay intact");
  assert.deepEqual(await resolveOwnedBooks(ctx.tx, "missing"), []);
  await checkDeleteUser();
  await checkDeleteUser({ adminId: "owner" });
  await checkDeleteUser({ missing: true });
  await checkDeleteUser({ lastAdmin: true });
  await checkDeleteUser({ code: "P2034" });
  await checkDeleteUser({ code: "P2025" });
  console.log("book data and user deletion ok");
}
void check();
