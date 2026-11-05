// Run: npx tsx src/lib/search.check.ts
import { matchesSearch } from "./search";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
assert(matchesSearch("mandado", ["Mandado semanal"]), "ignores case");
assert(matchesSearch("cafe", ["Café"]), "ignores accents in the text");
assert(matchesSearch("CAFÉ", ["cafe"]), "ignores accents in the query");
assert(matchesSearch("pena", ["Peña"]), "treats ñ as n");
assert(matchesSearch("bbva", ["Súper", null, "BBVA"]), "checks every field");
assert(!matchesSearch("renta", ["Súper", null, undefined]), "no match");
console.log("search ok");
