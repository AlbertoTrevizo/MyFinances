import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { currentMonthKey, expenseYears, formatMonth, monthNames, parsePeriod, periodBounds } from "@/lib/date";
import { matchesSearch } from "@/lib/search";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { ExpensesTable } from "@/components/ExpensesTable";
import { NewExpenseButton } from "@/components/NewExpenseButton";
import { card } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";
import { requireUser } from "@/lib/session";

const SORT_FIELDS = ["date", "description", "account", "category", "type", "amount"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.expenses.title };
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; q?: string; month?: string }>;
}) {
  await requireUser();
  const { locale, t } = await getTranslations();
  const sp = await searchParams;
  const { field, dir } = resolveSort(sp, SORT_FIELDS, "date", "desc");

  // Repeated params (?q=a&q=b) arrive as arrays; treat anything but a string as empty.
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const q = str(sp.q).trim();
  const currentMonth = currentMonthKey();
  const requestedPeriod = str(sp.month);
  const period = parsePeriod(requestedPeriod) ?? { kind: "month", key: currentMonth };
  const month = period.kind === "month" ? period.key : period.kind === "year" ? String(period.year).padStart(4, "0") : "all";
  const bounds = periodBounds(period);
  const monthLabel = period.kind === "month"
    ? formatMonth(bounds!.start, locale)
    : period.kind === "year" ? t.expenses.periodYear(period.year) : t.expenses.periodAll;

  const orderBy =
    field === "account"
      ? { account: { name: dir } }
      : field === "category"
        ? { category: { name: dir } }
        : field === "type"
          ? { type: dir }
          : field === "amount"
            ? { amountCents: dir }
            : field === "description"
              ? { description: dir }
              : { date: dir };

  const [expenseDates, expensesInPeriod, accounts, categories] = await Promise.all([
    prisma.expense.findMany({ select: { date: true } }),
    prisma.expense.findMany({
      where: bounds ? { date: { gte: bounds.start, lt: bounds.endExclusive } } : {},
      orderBy,
      include: { account: true, category: true },
    }),
    prisma.account.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const hasExpenses = expenseDates.length > 0;
  const years = expenseYears(
    expenseDates.map((expense) => expense.date),
    Number(currentMonth.slice(0, 4)),
    bounds?.start.getUTCFullYear() ?? Number(currentMonth.slice(0, 4)),
  );
  const months = monthNames(locale);

  // ponytail: filters in memory because Postgres can't ignore accents without raw SQL; the list
  // is already unpaginated. Move to a normalized column if a household ever outgrows this.
  const expenses = q
    ? expensesInPeriod.filter((expense) =>
        matchesSearch(q, [expense.description, expense.category?.name, expense.account.name]),
      )
    : expensesInPeriod;

  const accountOptions = accounts.map((account) => ({
    id: account.id,
    label: `${account.name} (${account.type})`,
    cutoffDay: account.cutoffDay,
  }));
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.name,
  }));

  const expenseRows = expenses.map((expense) => ({
    ...expense,
    confirmMessage: t.expenses.confirmDelete(expense.description),
  }));

  const tableCopy = {
    caption: t.expenses.title,
    actionsLabel: t.common.actions,
    tableDate: t.expenses.tableDate,
    tableDescription: t.expenses.tableDescription,
    tableAccount: t.expenses.tableAccount,
    tableCategory: t.expenses.tableCategory,
    tableType: t.expenses.tableType,
    tableAmount: t.expenses.tableAmount,
    noCategory: t.expenses.noCategory,
    noType: t.expenses.noType,
    msiBadge: t.expenses.msiBadge,
    msiInstallmentLocked: t.expenses.errors.msiInstallmentLocked,
    editLabel: t.common.edit,
    deleteLabel: t.common.delete,
    deletingLabel: t.common.deleting,
    cancelLabel: t.common.cancel,
    closeLabel: t.common.close,
    editTitle: t.expenses.editTitle,
    editSubmit: t.expenses.editSubmit,
    savingLabel: t.common.saving,
    form: t.expenses.form,
    expenseTypes: t.expenseTypes,
  };

  return (
    <PageContainer
      title={<PageTitle>{t.expenses.title}</PageTitle>}
      actions={
        <NewExpenseButton
          accounts={accountOptions}
          categories={categoryOptions}
          copy={{
            newButton: t.expenses.newButton,
            newTitle: t.expenses.newTitle,
            needsAccount: t.expenses.needsAccount,
            createAccountLink: t.expenses.createAccountLink,
            createSubmit: t.expenses.createSubmit,
            noCategory: t.expenses.noCategory,
            saving: t.common.saving,
            closeLabel: t.common.close,
            form: t.expenses.form,
            expenseTypes: t.expenseTypes,
          }}
        />
      }
    >
      {hasExpenses && (
        <ExpenseFilters
          q={q}
          month={month}
          currentMonth={currentMonth}
          monthLabel={monthLabel}
          months={months}
          years={years}
          sort={field}
          dir={dir}
          t={t.expenses.filters}
        />
      )}

      {expenses.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {q || !hasExpenses ? t.expenses.noResults : period.kind === "all"
            ? t.expenses.noExpensesAll
            : t.expenses.noExpensesMonth(period.kind === "year" ? String(period.year) : monthLabel)}
        </p>
      ) : (
        <div className={card}>
          <ExpensesTable
            expenses={expenseRows}
            accounts={accountOptions}
            categories={categoryOptions}
            locale={locale}
            copy={tableCopy}
            sort={field}
            dir={dir}
            query={{ q, month }}
          />
        </div>
      )}
    </PageContainer>
  );
}
