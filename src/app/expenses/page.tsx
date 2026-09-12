import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { buttonPrimary, linkMuted, card } from "@/lib/styles";
import { deleteExpense } from "./actions";

export default async function ExpensesPage() {
  const { locale, t } = await getTranslations();
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { account: true, category: true },
  });

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
                  <th className="px-4 py-3 font-medium">{t.expenses.tableDate}</th>
                  <th className="px-4 py-3 font-medium">{t.expenses.tableDescription}</th>
                  <th className="px-4 py-3 font-medium">{t.expenses.tableAccount}</th>
                  <th className="px-4 py-3 font-medium">{t.expenses.tableCategory}</th>
                  <th className="px-4 py-3 text-right font-medium">{t.expenses.tableAmount}</th>
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
