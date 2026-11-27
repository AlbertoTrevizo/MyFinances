// Run: node --import tsx src/lib/session.check.ts
import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import ts from "typescript";
import * as rules from "./book-rules";
import type * as Session from "./session";

const compiled = ts.transpileModule(readFileSync("src/lib/session.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function check() {
  const path = `/invitations?token=${"a".repeat(64)}`;
  for (const value of [path, undefined, "//evil.com", `${path}&extra=1`, "/invitations?token=short"]) {
    const deleted: string[] = [];
    let saved = value;
    const modules: Record<string, unknown> = {
      "crypto": crypto,
      "./prisma": { prisma: {} },
      "./roles": {},
      "./book-rules": rules,
      "@/i18n/get-locale": {},
      "react": { cache: (fn: unknown) => fn },
      "next/navigation": {},
      "next/headers": { cookies: async () => ({
        get: (name: string) => { assert.equal(name, "invitation_return"); return saved === undefined ? undefined : { value: saved }; },
        delete: (name: string) => { deleted.push(name); saved = undefined; },
      }) },
    };
    const exports = {} as typeof Session;
    runInThisContext(`(function(exports, require) { ${compiled}\n})`)(exports, (id: string) => {
      assert.ok(id in modules, `unexpected import: ${id}`);
      return modules[id];
    });
    assert.equal(await exports.takeInvitationReturn(), value === path ? path : "/");
    assert.deepEqual(deleted, ["invitation_return"]);
    assert.equal(await exports.takeInvitationReturn(), "/", "the return cookie is consumed once");
  }
  console.log("session return ok");
}
void check();
