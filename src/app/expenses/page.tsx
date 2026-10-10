import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dateToInputValue, inputValueToDate, monthKey } from "@/lib/date";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { ExpensesTable } from "@/components/ExpensesTable";
import { NewExpenseButton } from "@/components/NewExpenseButton";
import { card } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";

const SORT_FIELDS = ["date", "description", "account", "category", "type", "amount"] as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; q?: string; from?: string; to?: string }>;
}) {
  const { locale, t } = await getTranslations();
  const sp = await searchParams;
  const { field, dir } = resolveSort(sp, SORT_FIELDS, "date", "desc");

  const q = (sp.q ?? "").trim();
  // No date params at all → default to the current month; explicit empty params mean "all dates".
  const useDefaultRange = sp.from === undefined && sp.to === undefined;
  const now = new Date();
  const from = useDefaultRange ? `${monthKey(now)}-01` : (sp.from ?? "");
  const to = useDefaultRange
    ? dateToInputValue(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)))
    : (sp.to ?? "");

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

  const dateFrom = inputValueToDate(from);
  const dateTo = inputValueToDate(to);
  const dateToExclusive = dateTo ? new Date(dateTo.getTime() + 24 * 60 * 60 * 1000) : null;

  const conditions: Prisma.ExpenseWhereInput[] = [];
  if (dateFrom) conditions.push({ date: { gte: dateFrom } });
  if (dateToExclusive) conditions.push({ date: { lt: dateToExclusive } });
  if (q) {
    conditions.push({
      OR: [
        { description: { contains: q } },
        { category: { name: { contains: q } } },
        { account: { name: { contains: q } } },
      ],
    });
  }
  const where: Prisma.ExpenseWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const [totalCount, expenses, accounts, categories] = await Promise.all([
    prisma.expense.count(),
    prisma.expense.findMany({
      where,
      orderBy,
      include: { account: true, category: true },
    }),
    prisma.account.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const hasFilters = Boolean(q || from || to);

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
    tableDate: t.expenses.tableDate,
    tableDescription: t.expenses.tableDescription,
    tableAccount: t.expenses.tableAccount,
    tableCategory: t.expenses.tableCategory,
    tableType: t.expenses.tableType,
    tableAmount: t.expenses.tableAmount,
    noCategory: t.expenses.noCategory,
    noType: t.expenses.noType,
    msiBadge: t.expenses.msiBadge,
    editLabel: t.common.edit,
    deleteLabel: t.common.delete,
    deletingLabel: t.common.deleting,
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
            form: t.expenses.form,
            expenseTypes: t.expenseTypes,
          }}
        />
      }
    >
      {totalCount > 0 && (
        <ExpenseFilters q={q} from={from} to={to} sort={field} dir={dir} t={t.expenses.filters} />
      )}

      {expenses.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {hasFilters ? t.expenses.noResults : t.expenses.emptyMessage}
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
            query={{ q, from, to }}
          />
        </div>
      )}
    </PageContainer>
  );
}
