// Run: npx tsx src/lib/expense-type.check.ts
import { isExpenseType } from "./expense-type";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
for (const type of ["needs", "wants", "savings"]) {
  assert(isExpenseType(type), `GAS-6: accepts expense type ${type}`);
}
for (const value of [null, undefined, "", "Needs", "other", " needs ", 0, 1, NaN, true, {}, [], ["needs"]]) {
  assert(!isExpenseType(value), `GAS-6: rejects expense type ${JSON.stringify(value)}`);
}
console.log("expense-type ok");
