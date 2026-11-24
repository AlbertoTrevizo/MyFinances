// Run: npx tsx src/lib/sort.check.ts
import { resolveSort } from "./sort";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
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
