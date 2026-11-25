// Run: npx tsx src/lib/sort.check.ts
import { resolveSort, sortHeader } from "./sort";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
assert(JSON.stringify(sortHeader("date", "date", "asc", "/expenses")) === JSON.stringify({ active: true, href: "/expenses?sort=date&dir=desc" }), "GAS-18: active ascending header toggles to descending");
assert(JSON.stringify(sortHeader("date", "date", "desc", "/expenses")) === JSON.stringify({ active: true, href: "/expenses?sort=date&dir=asc" }), "GAS-18: active descending header toggles to ascending");
assert(JSON.stringify(sortHeader("description", "date", "asc", "/expenses")) === JSON.stringify({ active: false, href: "/expenses?sort=description&dir=asc" }), "GAS-18: new column starts ascending even when the previous one was ascending");
assert(JSON.stringify(sortHeader("description", "date", "desc", "/expenses", { q: "Café & tea", month: "2026-11", empty: "", ignored: undefined })) === JSON.stringify({ active: false, href: "/expenses?q=Caf%C3%A9+%26+tea&month=2026-11&empty=&sort=description&dir=asc" }), "GAS-18: preserves search, month, query order and encoding, retaining empty values but omitting undefined");
assert(sortHeader("name", "type", "desc", "/accounts").href === "/accounts?sort=name&dir=asc", "CUE-3: account header uses the shared sort link");
assert(sortHeader("name", "name", "asc", "/categories").href === "/categories?sort=name&dir=desc", "CAT-2: category header toggles its sort direction");
assert(sortHeader("role", "createdAt", "desc", "/users", { q: "Ana", sort: "old", dir: "desc" }).href === "/users?q=Ana&sort=role&dir=asc", "RF-14/ROL-3: sortable role overrides existing order parameters without losing search");

const fields = ["date", "description", "account", "category", "type", "amount"] as const;
for (const field of fields) {
  for (const dir of ["asc", "desc"] as const) {
    const result = resolveSort({ sort: field, dir }, fields, "date", "desc");
    assert(result.field === field && result.dir === dir, `GAS-18: accepts ${field} ${dir}`);
  }
}
for (const params of [{}, { sort: undefined, dir: undefined }, { sort: "bogus" }, { dir: "ASC" }, { sort: "", dir: "" }]) {
  const result = resolveSort(params, fields, "date", "desc");
  assert(result.field === "date" && result.dir === "desc", `GAS-18: defaults for ${JSON.stringify(params)}`);
}
const invalidField = resolveSort({ sort: "bogus", dir: "asc" }, fields, "date", "desc");
assert(invalidField.field === "date" && invalidField.dir === "asc", "GAS-18: invalid field defaults independently while preserving a valid direction");
const invalidDir = resolveSort({ sort: "description", dir: "bogus" }, fields, "date", "desc");
assert(invalidDir.field === "description" && invalidDir.dir === "desc", "GAS-18: invalid direction defaults independently while preserving a valid field");
// Repeated URL parameters can reach this helper despite its narrower signature.
const repeated = { sort: ["description"], dir: ["asc"] } as unknown as Parameters<typeof resolveSort>[0];
const result = resolveSort(repeated, fields, "date", "desc");
assert(result.field === "date" && result.dir === "desc", "GAS-18: array parameters use the initial order");
assert(resolveSort({}, ["name"], "name").dir === "asc", "CUE-3: omitted default direction is ascending");
console.log("sort ok");
