export function budgetProgress(spentCents: number, budgetCents: number) {
  const percent = budgetCents > 0 ? (spentCents / budgetCents) * 100 : 0;
  const over = spentCents > budgetCents;
  const remaining = Math.abs(budgetCents - spentCents);
  return { percent: Math.round(percent), width: Math.min(percent, 100), over, remaining };
}

export function spentSummary({ spentCents, budgetCents, previousCents }: {
  spentCents: number;
  budgetCents: number;
  previousCents: number;
}) {
  const changePercent = previousCents === 0 ? 0 : Math.round(Math.abs(((spentCents - previousCents) / previousCents) * 100));
  const change = previousCents === 0 ? null : {
    percent: changePercent,
    direction: changePercent === 0 ? "same" as const : spentCents > previousCents ? "up" as const : "down" as const,
  };
  return { ...budgetProgress(spentCents, budgetCents), hasBudget: budgetCents > 0, change };
}
