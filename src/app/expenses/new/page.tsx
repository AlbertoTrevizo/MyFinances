import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "../ExpenseForm";
import { createExpense } from "../actions";
import { getTranslations } from "@/i18n/get-locale";

export default async function NewExpensePage() {
  const { t } = await getTranslations();
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (accounts.length === 0 || categories.length === 0) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {t.expenses.newTitle}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t.expenses.needsAccountAndCategory}
        </p>
        <div className="flex gap-4 text-sm font-medium">
          {accounts.length === 0 && (
            <Link href="/accounts/new" className="text-zinc-900 underline dark:text-zinc-50">
              {t.expenses.createAccountLink}
            </Link>
          )}
          {categories.length === 0 && (
            <Link href="/categories/new" className="text-zinc-900 underline dark:text-zinc-50">
              {t.expenses.createCategoryLink}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t.expenses.newTitle}
      </h1>
      <ExpenseForm
        action={createExpense}
        accounts={accounts.map((a) => ({ id: a.id, label: `${a.name} (${a.type})` }))}
        categories={categories.map((c) => ({ id: c.id, label: c.name }))}
        submitLabel={t.expenses.createSubmit}
        t={t}
      />
    </div>
  );
}
