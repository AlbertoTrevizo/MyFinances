import type { Dictionary } from "@/i18n/dictionaries";

type BudgetItem = {
  label: string;
  color: string;
  spentCents: number;
  budgetCents: number;
};

export function BudgetProgress({
  items,
  t,
  formatValue,
}: {
  items: BudgetItem[];
  t: Dictionary["budget"];
  formatValue: (cents: number) => string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">{t.noBudgetSet}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const percent = item.budgetCents > 0 ? (item.spentCents / item.budgetCents) * 100 : 0;
        const over = item.spentCents > item.budgetCents;
        const remaining = Math.abs(item.budgetCents - item.spentCents);

        return (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-ink">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
              <span
                className={`font-mono text-xs font-medium ${over ? "text-danger" : "text-ink-muted"}`}
              >
                {Math.round(percent)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(percent, 100)}%`,
                  backgroundColor: over ? "var(--danger)" : item.color,
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs text-ink-muted">
              <span>
                {formatValue(item.spentCents)} {t.of} {formatValue(item.budgetCents)}
              </span>
              <span className={over ? "font-medium text-danger" : ""}>
                {over ? t.overBy(formatValue(remaining)) : t.remainingAmount(formatValue(remaining))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
