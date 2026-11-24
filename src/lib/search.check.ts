// Run: npx tsx src/lib/search.check.ts
import { matchesSearch } from "./search";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
assert(matchesSearch("mandado", ["Mandado semanal"]), "GAS-22: ignores case");
assert(matchesSearch("cafe", ["Café"]), "GAS-22: ignores accents in the text");
assert(matchesSearch("CAFÉ", ["cafe"]), "GAS-22: ignores accents and case in the query");
assert(matchesSearch("cafe", ["Cafe\u0301"]), "GAS-22: decomposed accents also match");
assert(matchesSearch("pena", ["Peña"]), "GAS-22: treats ñ as n in text");
assert(matchesSearch("PEÑA", ["pena"]), "GAS-22: treats ñ as n in the query");
assert(matchesSearch("seman", ["Mandado semanal"]), "GAS-22: matches a substring");
for (let field = 0; field < 3; field++) {
  const fields: (string | null | undefined)[] = [null, undefined, "other"];
  fields[field] = "Café";
  assert(matchesSearch("cafe", fields), `GAS-22: searches description/category/account at position ${field}`);
}
assert(matchesSearch("bbva", ["Súper", null, "BBVA"]), "GAS-22: checks later fields");
assert(!matchesSearch("renta", ["Súper", null, undefined]), "GAS-22: rejects a nonmatch while skipping absent fields");
assert(!matchesSearch("renta", [null, undefined]), "GAS-22: absent fields do not match text");
assert(!matchesSearch("renta", []), "GAS-22: no fields cannot match text");
assert(matchesSearch("", ["Café", null, undefined]), "GAS-22/GAS-23: an empty query does not filter an expense description");
console.log("search ok");
