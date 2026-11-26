import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { spentSummary } from "@/lib/budget";
import { formatCents } from "@/lib/currency";
import { card } from "@/lib/styles";
import { ExpensesIcon } from "@/components/icons";

export function SpentCard({
  spentCents,
  budgetCents,
  previousCents,
  monthLabel,
  previousMonthLabel,
  locale,
  t,
}: {
  spentCents: number;
  budgetCents: number;
  previousCents: number;
  monthLabel: string;
  previousMonthLabel: string;
  locale: Locale;
  t: Dictionary;
}) {
  const { hasBudget, percent, width, over, remaining, change } = spentSummary({ spentCents, budgetCents, previousCents });
  const budgetTextColor = over ? "text-danger" : "text-success-strong";

  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ExpensesIcon className="h-5 w-5" />
            </span>
            <p className="text-sm text-ink-muted">{t.home.spentInMonth(monthLabel)}</p>
          </div>
          <p className="mt-3 break-words text-3xl font-semibold tabular-nums text-ink sm:text-4xl">
            {formatCents(spentCents, locale)}
          </p>
          {change && (
            <p className={`mt-2 text-sm font-medium tabular-nums ${change.direction === "up" ? "text-danger" : change.direction === "down" ? "text-success-strong" : "text-ink-muted"}`}>
              {change.direction !== "same" && (
                <span aria-hidden="true">{change.direction === "up" ? "↑" : "↓"} </span>
              )}
              {change.direction === "same"
                ? t.home.spentSameAs(previousMonthLabel)
                : change.direction === "up"
                  ? t.home.spentMoreThan(change.percent, previousMonthLabel)
                  : t.home.spentLessThan(change.percent, previousMonthLabel)}
            </p>
          )}
        </div>

        <div className="w-full max-w-md">
          {hasBudget ? (
            <>
              <p className="text-sm text-ink-muted">{t.home.budgetAmount(formatCents(budgetCents, locale))}</p>
              <div className="mt-3 flex items-center gap-3">
                <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className={`h-full rounded-full ${over ? "bg-danger" : "bg-success"}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className={`shrink-0 text-sm font-medium tabular-nums ${budgetTextColor}`}>{t.budget.percentLabel(percent)}</span>
              </div>
              <p className={`mt-2 text-sm tabular-nums ${budgetTextColor}`}>
                {over
                  ? t.budget.overBy(formatCents(remaining, locale))
                  : t.budget.remainingAmount(formatCents(remaining, locale))}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-start gap-2 text-sm">
              <p className="text-ink-muted">{t.home.noBudget}</p>
              <Link
                href="/budget"
                className="rounded-sm font-medium text-primary hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t.budget.setBudgetLink}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
