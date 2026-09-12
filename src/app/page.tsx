import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { monthKey, parseMonthKey, formatMonth, dateToInputValue } from "@/lib/date";
import { EXPENSE_TYPES, isExpenseType } from "@/lib/expense-type";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { MonthSelect } from "@/components/MonthSelect";
import { DoughnutChart } from "@/components/DoughnutChart";
import { TopCategories } from "@/components/TopCategories";
import { MonthExpensesTable } from "@/components/MonthExpensesTable";
import { BudgetProgress } from "@/components/BudgetProgress";
import { ExpensesIcon, AccountsIcon, CategoriesIcon } from "@/components/icons";
import { card } from "@/lib/styles";

const CHART_PALETTE = [
  "#3457FF",
  "#16A34A",
  "#F59E0B",
  "#DC2626",
  "#8B5CF6",
  "#0EA5E9",
  "#EC4899",
  "#65A30D",
];
const CHART_SLICE_LIMIT = 6;
const OTHER_COLOR = "#98A2B3";

const TYPE_COLORS: Record<(typeof EXPENSE_TYPES)[number], string> = {
  needs: "#3457FF",
  wants: "#F59E0B",
  savings: "#16A34A",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale, t } = await getTranslations();

  const currentMonthKey = monthKey(new Date());
  const sp = await searchParams;
  const requestedMonth = sp.month && parseMonthKey(sp.month) ? sp.month : currentMonthKey;
  const monthStart = parseMonthKey(requestedMonth)!;
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
  const monthLabel = formatMonth(monthStart, locale);

  const [accountCount, categoryCount, expenseCount, monthExpenses, allExpenseDates, budgets] =
    await Promise.all([
      prisma.account.count(),
      prisma.category.count(),
      prisma.expense.count(),
      prisma.expense.findMany({
        where: { date: { gte: monthStart, lt: monthEnd } },
        include: { category: true, account: true },
        orderBy: { date: "desc" },
      }),
      prisma.expense.findMany({ select: { date: true } }),
      prisma.budget.findMany(),
    ]);

  const countedExpenses = monthExpenses.filter((expense) => !expense.excludeFromTotals);
  const monthTotal = countedExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  const totalsByCategory = new Map<string, { label: string; value: number }>();
  for (const expense of countedExpenses) {
    const key = expense.category?.id ?? "__none__";
    const label = expense.category?.name ?? t.expenses.noCategory;
    const entry = totalsByCategory.get(key) ?? { label, value: 0 };
    entry.value += expense.amountCents;
    totalsByCategory.set(key, entry);
  }
  const sortedCategories = [...totalsByCategory.values()].sort((a, b) => b.value - a.value);

  const chartSlices = sortedCategories.slice(0, CHART_SLICE_LIMIT).map((category, index) => ({
    ...category,
    color: CHART_PALETTE[index % CHART_PALETTE.length],
  }));
  const remaining = sortedCategories.slice(CHART_SLICE_LIMIT);
  if (remaining.length > 0) {
    chartSlices.push({
      label: t.home.otherCategory,
      value: remaining.reduce((sum, category) => sum + category.value, 0),
      color: OTHER_COLOR,
    });
  }

  const topCategories = sortedCategories.slice(0, 5).map((category, index) => ({
    ...category,
    color: CHART_PALETTE[index % CHART_PALETTE.length],
  }));
  const topCategoriesMax = topCategories[0]?.value ?? 0;

  const totalsByType = new Map<string, number>();
  for (const expense of countedExpenses) {
    const key = isExpenseType(expense.type) ? expense.type : "__none__";
    totalsByType.set(key, (totalsByType.get(key) ?? 0) + expense.amountCents);
  }
  const typeSlices = [
    ...EXPENSE_TYPES.map((type) => ({
      label: t.expenseTypes[type],
      value: totalsByType.get(type) ?? 0,
      color: TYPE_COLORS[type],
    })).filter((slice) => slice.value > 0),
    ...(totalsByType.get("__none__")
      ? [{ label: t.expenses.noType, value: totalsByType.get("__none__")!, color: OTHER_COLOR }]
      : []),
  ];

  const budgetByType = new Map(budgets.map((b) => [b.type, b.amountCents]));
  const budgetItems = EXPENSE_TYPES.map((type) => ({
    label: t.expenseTypes[type],
    color: TYPE_COLORS[type],
    spentCents: totalsByType.get(type) ?? 0,
    budgetCents: budgetByType.get(type) ?? 0,
  })).filter((item) => item.budgetCents > 0);

  const monthEndInclusive = new Date(monthEnd.getTime() - 24 * 60 * 60 * 1000);
  const expensesHref = `/expenses?from=${dateToInputValue(monthStart)}&to=${dateToInputValue(monthEndInclusive)}`;

  const monthKeys = new Set(allExpenseDates.map((row) => monthKey(row.date)));
  monthKeys.add(currentMonthKey);
  const monthOptions = [...monthKeys]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((key) => ({ value: key, label: formatMonth(parseMonthKey(key)!, locale) }));

  const cards = [
    {
      href: "/expenses",
      label: t.home.expensesCard.label,
      description: t.home.expensesCard.description,
      stat: t.home.expensesCard.stat(expenseCount),
      icon: ExpensesIcon,
    },
    {
      href: "/accounts",
      label: t.home.accountsCard.label,
      description: t.home.accountsCard.description,
      stat: t.home.accountsCard.stat(accountCount),
      icon: AccountsIcon,
    },
    {
      href: "/categories",
      label: t.home.categoriesCard.label,
      description: t.home.categoriesCard.description,
      stat: t.home.categoriesCard.stat(categoryCount),
      icon: CategoriesIcon,
    },
  ];

  return (
    <PageContainer
      title={<PageTitle>{t.home.greeting}</PageTitle>}
      actions={
        <MonthSelect value={requestedMonth} options={monthOptions} label={t.home.monthSelectLabel} />
      }
    >
      <div className={`${card} p-5 sm:p-6`}>
        <p className="text-sm text-ink-muted capitalize">{t.home.spentInMonth(monthLabel)}</p>
        <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ink sm:text-4xl">
          {formatCents(monthTotal, locale)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="mb-4 text-sm font-semibold text-ink">{t.home.byCategoryTitle}</h2>
          <DoughnutChart
            data={chartSlices}
            total={monthTotal}
            centerValue={formatCents(monthTotal, locale)}
            centerLabel={monthLabel}
            emptyMessage={t.home.noExpensesMonth}
          />
        </div>

        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="mb-4 text-sm font-semibold text-ink">{t.home.byTypeTitle}</h2>
          <DoughnutChart
            data={typeSlices}
            total={monthTotal}
            centerValue={formatCents(monthTotal, locale)}
            centerLabel={monthLabel}
            emptyMessage={t.home.noExpensesMonth}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="mb-4 text-sm font-semibold text-ink">{t.home.topCategoriesTitle}</h2>
          <TopCategories
            items={topCategories}
            maxValue={topCategoriesMax}
            emptyMessage={t.home.noExpensesMonth}
            formatValue={(value) => formatCents(value, locale)}
          />
        </div>

        <div className={`${card} p-5 sm:p-6`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">{t.budget.widgetTitle}</h2>
            <Link
              href="/budget"
              className="text-sm font-medium text-primary hover:text-primary-strong"
            >
              {t.budget.setBudgetLink}
            </Link>
          </div>
          <BudgetProgress
            items={budgetItems}
            t={t.budget}
            formatValue={(value) => formatCents(value, locale)}
          />
        </div>
      </div>

      <div className={`${card} p-5 sm:p-6`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">{t.home.monthRecordsTitle}</h2>
          <Link
            href={expensesHref}
            className="text-sm font-medium text-primary hover:text-primary-strong"
          >
            {t.home.viewAllLink}
          </Link>
        </div>
        {monthExpenses.length === 0 ? (
          <p className="text-sm text-ink-muted">{t.home.noExpensesMonth}</p>
        ) : (
          <MonthExpensesTable
            expenses={monthExpenses}
            locale={locale}
            t={t.expenses}
            expenseTypes={t.expenseTypes}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex flex-col gap-3 ${card} p-5 transition-colors hover:border-primary/40`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <item.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="font-semibold text-ink">{item.label}</span>
            <span className="text-sm text-ink-muted">{item.description}</span>
            <span className="mt-1 font-mono text-sm font-medium text-ink-muted transition-colors group-hover:text-primary">
              {item.stat}
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
