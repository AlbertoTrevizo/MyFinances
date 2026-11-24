// Run: npx tsx src/lib/msi.check.ts
import { buildMsiInstallments, buildMsiInstallmentRows, isMsiInstallment, isValidMsiMonths, parseMsiMonths } from "./msi";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
for (const months of [2, 36]) assert(isValidMsiMonths(months), `GAS-11: accepts ${months} months`);
for (const months of [1, 37, 2.5, 35.5, NaN, Infinity]) {
  assert(!isValidMsiMonths(months), `GAS-11: rejects ${months} months`);
}
for (const [input, months] of [["2", 2], ["36", 36], ["3", 3], ["03", 3]] as const) {
  assert(parseMsiMonths(input) === months, `GAS-11: parses base-10 integer ${JSON.stringify(input)} as ${months}`);
}
for (const input of ["1", "37", "2.5", "2abc", "", " ", "+3", "-3", "1e1", "0x3", " 3", "3 ", "3\n"]) {
  assert(parseMsiMonths(input) === null, `GAS-11: rejects invalid MSI months ${JSON.stringify(input)}`);
}
assert(isMsiInstallment({ msiGroupId: "g", excludeFromTotals: false }), "GAS-29: recognizes installment");
assert(!isMsiInstallment({ msiGroupId: "g", excludeFromTotals: true }), "GAS-12: original is not an installment");
assert(!isMsiInstallment({ msiGroupId: null, excludeFromTotals: false }), "GAS-29: normal expense is not an installment");
assert(!isMsiInstallment({ msiGroupId: null, excludeFromTotals: true }), "GAS-29: excluding a row alone does not make it an installment");

const examples = [
  ["2026-03-10", 15, ["2026-03-15", "2026-04-15", "2026-05-15"]],
  ["2026-03-15", 15, ["2026-03-15", "2026-04-15", "2026-05-15"]],
  ["2026-03-16", 15, ["2026-04-15", "2026-05-15", "2026-06-15"]],
  ["2026-01-20", 31, ["2026-01-31", "2026-02-28", "2026-03-31"]],
  ["2026-12-20", 15, ["2027-01-15", "2027-02-15", "2027-03-15"]],
] as const;
for (const [purchase, cutoffDay, dates] of examples) {
  const installments = buildMsiInstallments({ totalCents: 100000, months: 3, purchaseDate: new Date(`${purchase}T00:00:00Z`), cutoffDay });
  assert(installments.length === 3, `GAS-12: ${purchase} creates three installments`);
  assert(installments.map((r) => r.date.toISOString()).join() === dates.map((d) => `${d}T00:00:00.000Z`).join(), `GAS-14: table dates for ${purchase} at cutoff ${cutoffDay}, at UTC midnight`);
  assert(installments.map((r) => r.amountCents).join() === "33334,33333,33333", `GAS-13/GAS-14: table amounts for ${purchase}`);
  assert(installments.map((r) => r.index).join() === "1,2,3", `GAS-12: one-based installment indices for ${purchase}`);
}
for (const [totalCents, amounts] of [[100001, "33334,33334,33333"], [100002, "33334,33334,33334"]] as const) {
  const installments = buildMsiInstallments({ totalCents, months: 3, purchaseDate: new Date("2026-03-10T00:00:00Z"), cutoffDay: 15 });
  assert(installments.map((r) => r.amountCents).join() === amounts, `GAS-13: distributes the remainder from the first installment for ${totalCents}`);
  assert(installments.reduce((sum, r) => sum + r.amountCents, 0) === totalCents, `GAS-13: installments sum to ${totalCents}`);
}
const longPlan = buildMsiInstallments({ totalCents: 100000, months: 36, purchaseDate: new Date("2026-12-10T00:00:00Z"), cutoffDay: 15 });
assert(longPlan.length === 36 && longPlan[35].date.toISOString() === "2029-11-15T00:00:00.000Z", "GAS-11/GAS-14: 36 installments cross multiple years");
assert(longPlan.reduce((sum, r) => sum + r.amountCents, 0) === 100000, "GAS-13: 36 installments retain the total");
const leap = buildMsiInstallments({ totalCents: 100, months: 2, purchaseDate: new Date("2028-01-20T00:00:00Z"), cutoffDay: 31 });
assert(leap[1].date.toISOString() === "2028-02-29T00:00:00.000Z", "GAS-14: clamps to the last day of leap February");

for (const optional of [{ notes: "note", categoryId: "category", type: "wants" }, { notes: null, categoryId: null, type: null }]) {
  const original = { description: "TV", amountCents: 100000, date: new Date("2026-03-16T00:00:00Z"), accountId: "account", msiGroupId: "group", ...optional };
  const rows = buildMsiInstallmentRows(original, 3, 15);
  assert(rows.length === 3 && rows.map((r) => r.description).join() === "TV 1/3,TV 2/3,TV 3/3", "GAS-12: builds N descriptions with i/N suffixes");
  assert(rows.every((r) => r.accountId === original.accountId && r.categoryId === original.categoryId && r.type === original.type && r.notes === original.notes && r.msiGroupId === original.msiGroupId && r.excludeFromTotals === false), "GAS-12: copies notes, account, category, type and group, including nulls, and counts installments in totals");
  assert(rows.map((r) => r.amountCents).join() === "33334,33333,33333", "GAS-13: rows retain the distributed amounts");
  assert(rows.map((r) => r.date.toISOString()).join() === "2026-04-15T00:00:00.000Z,2026-05-15T00:00:00.000Z,2026-06-15T00:00:00.000Z", "GAS-14: rows retain installment dates");
  assert(original.description === "TV" && original.amountCents === 100000 && original.date.toISOString() === "2026-03-16T00:00:00.000Z", "GAS-12: generating installments preserves the original description, total and date");
}
console.log("msi ok");
