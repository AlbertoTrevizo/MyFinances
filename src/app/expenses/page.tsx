import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "@/i18n/get-locale";
import { deleteExpense } from "./actions";

export default async function ExpensesPage() {
  const { locale, t } = await getTranslations();
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { account: true, category: true },
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t.expenses.title}
        </h1>
        <Link
          href="/expenses/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {t.expenses.newButton}
        </Link>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t.expenses.emptyMessage}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
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
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(expense.date, locale)}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                    {expense.description}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {expense.account.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {expense.category.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {formatCents(expense.amountCents, locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-4">
                      <Link
                        href={`/expenses/${expense.id}/edit`}
                        className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
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
      )}
    </div>
  );
}
