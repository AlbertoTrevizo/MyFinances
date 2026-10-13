// Run: npx tsx src/lib/currency.check.ts
import { pesosToCents, pesosToCentsOrZero } from "./currency";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
assert(pesosToCents("1,234.56") === 123456, "commas");
assert(pesosToCents("10") === 1000, "integer");
for (const bad of ["Infinity", "1e10", "12abc", "-5", "0", "0.001", "1.234", "", "30000000"]) {
  assert(pesosToCents(bad) === null, `rejects ${bad}`);
}
assert(pesosToCentsOrZero("") === 0 && pesosToCentsOrZero("0") === 0 && pesosToCentsOrZero("-1") === null, "or-zero");
console.log("currency ok");
