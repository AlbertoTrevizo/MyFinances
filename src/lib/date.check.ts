// Run: npx tsx src/lib/date.check.ts
import { currentMonthKey } from "./date";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
const at = (iso: string) => currentMonthKey(new Date(iso));
assert(at("2026-12-01T00:30:00Z") === "2026-11", "18:30 in Mexico on Nov 30 is still November");
assert(at("2026-12-01T05:59:00Z") === "2026-11", "23:59 in Mexico on Nov 30 is still November");
assert(at("2026-12-01T06:00:00Z") === "2026-12", "midnight in Mexico starts December");
assert(at("2027-01-01T05:59:00Z") === "2026-12", "year boundary");
console.log("date ok");
