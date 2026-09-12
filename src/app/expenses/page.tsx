import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { SortableHeader } from "@/components/SortableHeader";
import { buttonPrimary, linkMuted, card } from "@/lib/styles";
import { resolveSort } from "@/lib/sort";
import { deleteExpense } from "./actions";

const SORT_FIELDS = ["date", "description", "account", "category", "amount"] as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const { locale, t } = await getTranslations();
  const sp = await searchParams;
  const { field, dir } = resolveSort(sp, SORT_FIELDS, "date", "desc");

  const orderBy =
    field === "account"
      ? { account: { name: dir } }
      : field === "category"
        ? { category: { name: dir } }
        : field === "amount"
          ? { amountCents: dir }
          : field === "description"
            ? { description: dir }
            : { date: dir };

  const expenses = await prisma.expense.findMany({
    orderBy,
    include: { account: true, category: true },
  });

  const header = (label: string, key: (typeof SORT_FIELDS)[number], align?: "right") => (
    <SortableHeader
      label={label}
      field={key}
      activeField={field}
      dir={dir}
      basePath="/expenses"
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
      {expenses.length === 0 ? (
        <p className="text-sm text-ink-muted">{t.expenses.emptyMessage}</p>
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
                    className="border-t border-line transition-colors hover:bg-canvas"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-ink-muted">
                      {formatDate(expense.date, locale)}
                    </td>
                    <td className="px-4 py-3 text-ink">{expense.description}</td>
                    <td className="px-4 py-3 text-ink-muted">{expense.account.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{expense.category.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink">
                      {formatCents(expense.amountCents, locale)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-4">
                        <Link href={`/expenses/${expense.id}/edit`} className={linkMuted}>
                          {t.common.edit}
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
