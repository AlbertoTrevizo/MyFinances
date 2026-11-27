// Run: node --import tsx src/app/invitations/actions.check.ts
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { Prisma } from "@prisma/client";
import ts from "typescript";
import * as rules from "../../lib/book-rules";
import type * as Actions from "./actions";

const compiled = ts.transpileModule(readFileSync("src/app/invitations/actions.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const token = "ab".repeat(32);
const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");

function setup({ missing = false, expired = false, email = null as string | null, access = null as rules.BookAccess | null, role = "viewer" as "viewer" | "editor", claimCount = 1, code = "" } = {}) {
  let authenticated = false;
  let remaining = !missing;
  const writes: string[] = [];
  const events: unknown[] = [];
  const cookies: string[] = [];
  const invalidations: unknown[] = [];
  const row = {
    id: "invitation", bookId: "book", email, role,
    expiresAt: new Date(Date.now() + (expired ? -1000 : 100000)),
    book: { ownerId: access === "owner" ? "user" : "owner" },
  };
  const db = {
    bookInvitation: {
      findUnique: async ({ where, include }: { where: { tokenHash: string }; include: unknown }) => {
        assert.ok(authenticated);
        assert.deepEqual(where, { tokenHash: hashToken(token) });
        assert.deepEqual(include, { book: { select: { ownerId: true } } });
        return remaining ? row : null;
      },
      deleteMany: async ({ where }: { where: { id: string } }) => {
        assert.deepEqual(where, { id: "invitation" });
        remaining = false;
        if (claimCount) writes.push("delete invitation");
        return { count: claimCount };
      },
    },
    bookMember: {
      findUnique: async ({ where }: { where: unknown }) => {
        assert.deepEqual(where, { bookId_userId: { bookId: "book", userId: "user" } });
        return access === "viewer" || access === "editor" ? { role: access } : null;
      },
      create: async ({ data }: { data: unknown }) => {
        assert.equal(remaining, false, "claim the invitation before creating membership");
        assert.deepEqual(data, { bookId: "book", userId: "user", role });
        if (code) throw new Prisma.PrismaClientKnownRequestError("concurrent transaction", { code, clientVersion: "test" });
        writes.push("create membership");
      },
    },
    user: {
      update: async ({ where, data }: { where: unknown; data: unknown }) => {
        assert.deepEqual(where, { id: "user" });
        assert.deepEqual(data, { activeBookId: "book" });
        writes.push("set active book");
      },
    },
  };
  const modules: Record<string, unknown> = {
    "@prisma/client": { Prisma },
    "@/lib/book-rules": rules,
    "@/lib/session": { hashToken, requireUser: async () => { authenticated = true; return { id: "user", email: "guest@example.com" }; } },
    "@/lib/prisma": { prisma: { $transaction: async (run: (tx: typeof db) => Promise<unknown>, options: unknown) => {
      assert.ok(authenticated);
      assert.deepEqual(options, { isolationLevel: "Serializable" });
      const previous = remaining;
      try {
        return await run(db);
      } catch (error) {
        remaining = previous;
        writes.length = 0;
        throw error;
      }
    } } },
    "next/headers": { cookies: async () => ({ delete: (name: string) => cookies.push(name) }) },
    "next/cache": { revalidatePath: (...args: unknown[]) => invalidations.push(args) },
    "next/navigation": { redirect: (path: string) => { throw new Error(`redirect:${path}`); } },
    "@/lib/log": { logEvent: (...args: unknown[]) => events.push(args) },
  };
  const exports = {} as typeof Actions;
  runInThisContext(`(function(exports, require) { ${compiled}\n})`)(exports, (id: string) => {
    assert.ok(id in modules, `unexpected import: ${id}`);
    return modules[id];
  });
  return { actions: exports, writes, events, cookies, invalidations, remaining: () => remaining };
}

async function check() {
  for (const options of [{ missing: true }, { expired: true }]) {
    const ctx = setup(options);
    assert.deepEqual(await ctx.actions.acceptInvitation(token), { error: "invalid" });
    assert.deepEqual(ctx.writes, [], "invalid and expired invitations must cause no writes");
    assert.equal(ctx.remaining(), !options.missing);
    assert.deepEqual(ctx.cookies, []);
    assert.deepEqual(ctx.events, []);
  }
  let ctx = setup({ email: "other@example.com" });
  assert.deepEqual(await ctx.actions.acceptInvitation(token), { error: "wrongAccount" });
  assert.deepEqual(ctx.writes, []);
  assert.equal(ctx.remaining(), true, "the wrong account must not spend an invitation");

  for (const access of ["owner", "editor", "viewer"] as const) {
    ctx = setup({ access });
    assert.deepEqual(await ctx.actions.acceptInvitation(token), { error: "alreadyMember" });
    assert.deepEqual(ctx.writes, [], "alreadyMember must not spend an invitation or change permission");
    assert.equal(ctx.remaining(), true, "alreadyMember must keep the invitation");
    assert.deepEqual(ctx.events, []);
    assert.deepEqual(ctx.cookies, []);
  }
  for (const role of ["viewer", "editor"] as const) {
    ctx = setup({ role, email: role === "editor" ? "GUEST@EXAMPLE.COM" : null });
    await assert.rejects(ctx.actions.acceptInvitation(token), /redirect:\/$/);
    assert.deepEqual(ctx.writes, ["delete invitation", "create membership", "set active book"]);
    assert.equal(ctx.remaining(), false);
    assert.deepEqual(ctx.cookies, ["invitation_return"]);
    assert.deepEqual(ctx.invalidations, [["/", "layout"]]);
    assert.deepEqual(ctx.events, [["book_invitation_accepted", { bookId: "book", userId: "user" }]]);
  }
  ctx = setup({ claimCount: 0 });
  assert.deepEqual(await ctx.actions.acceptInvitation(token), { error: "invalid" });
  assert.deepEqual(ctx.writes, [], "a concurrent spend must not create a membership or change the active book");
  assert.deepEqual(ctx.events, []);
  assert.deepEqual(ctx.cookies, []);
  for (const code of ["P2002", "P2034"]) {
    ctx = setup({ code });
    assert.deepEqual(await ctx.actions.acceptInvitation(token), { error: code === "P2002" ? "alreadyMember" : "conflict" });
    assert.equal(ctx.remaining(), true, "failed transactions roll back the invitation claim");
    assert.deepEqual(ctx.writes, []);
    assert.deepEqual(ctx.cookies, []);
    assert.deepEqual(ctx.events, []);
  }
  console.log("invitation actions ok");
}
void check();
