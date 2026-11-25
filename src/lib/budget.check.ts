import assert from "node:assert/strict";
import { budgetProgress } from "./budget";

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
console.log("budget ok");
