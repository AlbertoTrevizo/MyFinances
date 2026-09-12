import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { formatDate, inputValueToDate } from "@/lib/date";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { SortableHeader } from "@/components/SortableHeader";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { PencilIcon } from "@/components/icons";
import { buttonPrimary, iconButton, card } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";
import { isExpenseType } from "@/lib/expense-type";
import { deleteExpense } from "./actions";

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
  const from = sp.from ?? "";
  const to = sp.to ?? "";

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

  const [totalCount, expenses] = await Promise.all([
    prisma.expense.count(),
    prisma.expense.findMany({
      where,
      orderBy,
      include: { account: true, category: true },
    }),
  ]);

  const hasFilters = Boolean(q || from || to);

  const header = (label: string, key: (typeof SORT_FIELDS)[number], align?: "right") => (
    <SortableHeader
      label={label}
      field={key}
      activeField={field}
      dir={dir}
      basePath="/expenses"
      query={{ q, from, to }}
      align={align}
    />
  );

  return (
    <PageContainer
      title={<PageTitle>{t.expenses.title}</PageTitle>}
      actions={
        <Link href="/expenses/new" className={buttonPrimary}>
          {t.expenses.newButton}
        </Link>
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
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-canvas text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{header(t.expenses.tableDate, "date")}</th>
                  <th className="px-4 py-3 font-medium">
                    {header(t.expenses.tableDescription, "description")}
                  </th>
                  <th className="px-4 py-3 font-medium">{header(t.expenses.tableAccount, "account")}</th>
                  <th className="px-4 py-3 font-medium">
                    {header(t.expenses.tableCategory, "category")}
                  </th>
                  <th className="px-4 py-3 font-medium">{header(t.expenses.tableType, "type")}</th>
                  <th className="px-4 py-3 text-right font-medium">
                    {header(t.expenses.tableAmount, "amount", "right")}
                  </th>
                  <th className="px-4 py-3 font-medium"></th>
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
                          {t.expenses.msiBadge}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{expense.account.name}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {expense.category?.name ?? (
                        <span className="text-ink-faint">{t.expenses.noCategory}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {isExpenseType(expense.type) ? (
                        t.expenseTypes[expense.type]
                      ) : (
                        <span className="text-ink-faint">{t.expenses.noType}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink">
                      {formatCents(expense.amountCents, locale)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/expenses/${expense.id}/edit`}
                          aria-label={t.common.edit}
                          title={t.common.edit}
                          className={iconButton}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <DeleteButton
                          action={deleteExpense.bind(null, expense.id)}
                          confirmMessage={t.expenses.confirmDelete(expense.description)}
                          label={t.common.delete}
                          pendingLabel={t.common.deleting}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
