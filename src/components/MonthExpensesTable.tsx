import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { isExpenseType } from "@/lib/expense-type";

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
  return (
    <div className="overflow-x-auto rounded-xl">
      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 bg-canvas text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t.tableDate}</th>
              <th className="px-4 py-3 font-medium">{t.tableDescription}</th>
              <th className="px-4 py-3 font-medium">{t.tableAccount}</th>
              <th className="px-4 py-3 font-medium">{t.tableCategory}</th>
              <th className="px-4 py-3 font-medium">{t.tableType}</th>
              <th className="px-4 py-3 text-right font-medium">{t.tableAmount}</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className={`border-t border-line transition-colors hover:bg-canvas ${
                  expense.excludeFromTotals ? "opacity-50" : ""
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-ink-muted">
                  {formatDate(expense.date, locale)}
                </td>
                <td className="px-4 py-3 text-ink">
                  {expense.description}
                  {expense.excludeFromTotals && (
                    <span className="ml-2 rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                      {t.msiBadge}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{expense.account.name}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {expense.category?.name ?? <span className="text-ink-faint">{t.noCategory}</span>}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {isExpenseType(expense.type) ? (
                    expenseTypes[expense.type]
                  ) : (
                    <span className="text-ink-faint">{t.noType}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink">
                  {formatCents(expense.amountCents, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
