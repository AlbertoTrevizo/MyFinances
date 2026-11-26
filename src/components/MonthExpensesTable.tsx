import { useId } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { isExpenseType } from "@/lib/expense-type";
import { badge, expenseTypeBadge } from "@/lib/styles";

type Row = {
  id: string;
  date: Date;
  description: string;
  amountCents: number;
  type: string | null;
  excludeFromTotals: boolean;
  account: { name: string };
  category: { name: string } | null;
};

export function MonthExpensesTable({
  expenses,
  locale,
  t,
  expenseTypes,
}: {
  expenses: Row[];
  locale: Locale;
  t: Dictionary["expenses"];
  expenseTypes: Dictionary["expenseTypes"];
}) {
  const captionId = useId();

  return (
    <div role="region" tabIndex={0} aria-labelledby={captionId} className="max-h-[420px] max-w-full overflow-auto rounded-2xl">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption id={captionId} className="sr-only">{t.title}</caption>
        <thead className="sticky top-0 border-b border-line bg-surface text-xs font-medium text-ink-muted">
          <tr>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t.tableDate}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t.tableDescription}</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t.tableAccount}</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t.tableCategory}</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t.tableType}</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium">{t.tableAmount}</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className={`border-b border-line last:border-b-0 transition-colors hover:bg-canvas/60 ${
                expense.excludeFromTotals ? "bg-canvas" : ""
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-ink-muted">
                {formatDate(expense.date, locale)}
              </td>
              <td className="px-4 py-3.5 font-semibold text-ink">
                {expense.description}
                {expense.excludeFromTotals && (
                  <span className={`${badge} ml-2 bg-primary-soft text-primary-strong`}>
                    {t.msiBadge}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">{expense.account.name}</td>
              <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">
                {expense.category?.name ?? <span className="text-ink-faint">{t.noCategory}</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">
                {isExpenseType(expense.type) ? (
                  <span className={`${badge} ${expenseTypeBadge[expense.type]}`}>
                    {expenseTypes[expense.type]}
                  </span>
                ) : (
                  <span className="text-ink-faint">{t.noType}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium tabular-nums text-ink">
                {formatCents(expense.amountCents, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
