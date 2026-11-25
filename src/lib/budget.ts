export function budgetProgress(spentCents: number, budgetCents: number) {
  const percent = budgetCents > 0 ? (spentCents / budgetCents) * 100 : 0;
  const over = spentCents > budgetCents;
  const remaining = Math.abs(budgetCents - spentCents);
  return { percent: Math.round(percent), width: Math.min(percent, 100), over, remaining };
}
