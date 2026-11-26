import assert from "node:assert/strict";
import { budgetProgress, spentSummary } from "./budget";

for (const [spent, budget, expected] of [
  [0, 100, { percent: 0, width: 0, over: false, remaining: 100 }],
  [1, 3, { percent: 33, width: (1 / 3) * 100, over: false, remaining: 2 }],
  [2, 3, { percent: 67, width: (2 / 3) * 100, over: false, remaining: 1 }],
  [100, 100, { percent: 100, width: 100, over: false, remaining: 0 }],
  [150, 100, { percent: 150, width: 100, over: true, remaining: 50 }],
  [0, 0, { percent: 0, width: 0, over: false, remaining: 0 }],
  [1, 0, { percent: 0, width: 0, over: true, remaining: 1 }],
] as const) {
  assert.deepEqual(budgetProgress(spent, budget), expected, `PRE-12/PRE-13: ${spent}/${budget} rounds the label, caps only the bar, and exceeds only strictly above budget`);
}
for (const [spentCents, budgetCents, previousCents, expected] of [
  [100, 100, 100, { hasBudget: true, percent: 100, width: 100, over: false, remaining: 0, change: { percent: 0, direction: "same" } }],
  [150, 100, 100, { hasBudget: true, percent: 150, width: 100, over: true, remaining: 50, change: { percent: 50, direction: "up" } }],
  [50, 0, 100, { hasBudget: false, percent: 0, width: 0, over: true, remaining: 50, change: { percent: 50, direction: "down" } }],
  [0, 0, 0, { hasBudget: false, percent: 0, width: 0, over: false, remaining: 0, change: null }],
  [50, 100, 0, { hasBudget: true, percent: 50, width: 50, over: false, remaining: 50, change: null }],
  [112, 200, 100, { hasBudget: true, percent: 56, width: (112 / 200) * 100, over: false, remaining: 88, change: { percent: 12, direction: "up" } }],
  [92, 200, 100, { hasBudget: true, percent: 46, width: 46, over: false, remaining: 108, change: { percent: 8, direction: "down" } }],
  [100, 200, 100, { hasBudget: true, percent: 50, width: 50, over: false, remaining: 100, change: { percent: 0, direction: "same" } }],
  // Changes rounded to 0% are neutral in both directions.
  [1001, 2000, 1000, { hasBudget: true, percent: 50, width: (1001 / 2000) * 100, over: false, remaining: 999, change: { percent: 0, direction: "same" } }],
  [999, 2000, 1000, { hasBudget: true, percent: 50, width: (999 / 2000) * 100, over: false, remaining: 1001, change: { percent: 0, direction: "same" } }],
  [0, 100, 100, { hasBudget: true, percent: 0, width: 0, over: false, remaining: 100, change: { percent: 100, direction: "down" } }],
] as const) {
  assert.deepEqual(spentSummary({ spentCents, budgetCents, previousCents }), expected, `RED-10..RED-14/PRE-13: summary for spent=${spentCents}, budget=${budgetCents}, previous=${previousCents}`);
}
console.log("budget ok");
