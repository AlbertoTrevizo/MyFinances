// Run: npx tsx src/lib/msi.check.ts
import { buildMsiInstallmentRows, isMsiInstallment } from "./msi";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
const day = (d: Date) => d.toISOString().slice(0, 10);

assert(isMsiInstallment({ msiGroupId: "g", excludeFromTotals: false }), "installment");
assert(!isMsiInstallment({ msiGroupId: "g", excludeFromTotals: true }), "original");
assert(!isMsiInstallment({ msiGroupId: null, excludeFromTotals: false }), "normal expense");

const rows = buildMsiInstallmentRows(
  {
    description: "TV",
    notes: "note",
    amountCents: 100000,
    date: new Date("2026-03-16T00:00:00Z"),
    accountId: "a",
    categoryId: null,
    type: "wants",
    msiGroupId: "g",
  },
  3,
  15,
);
assert(rows.map((r) => r.description).join() === "TV 1/3,TV 2/3,TV 3/3", "descriptions");
assert(rows.map((r) => r.amountCents).join() === "33334,33333,33333", "amounts add up to the total");
assert(rows.map((r) => day(r.date)).join() === "2026-04-15,2026-05-15,2026-06-15", "dates after cutoff");
assert(rows.every((r) => !r.excludeFromTotals && r.msiGroupId === "g" && r.notes === "note"), "copied");

const [jan, feb] = buildMsiInstallmentRows(
  { ...rows[0], amountCents: 100000, date: new Date("2026-01-20T00:00:00Z") },
  2,
  31,
);
assert(day(jan.date) === "2026-01-31" && day(feb.date) === "2026-02-28", "short month clamps");
console.log("msi ok");
