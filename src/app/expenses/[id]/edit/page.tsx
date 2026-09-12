import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centsToPesosInput } from "@/lib/currency";
import { dateToInputValue } from "@/lib/date";
import { ExpenseForm } from "../../ExpenseForm";
import { updateExpense } from "../../actions";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, accounts, categories] = await Promise.all([
    prisma.expense.findUnique({ where: { id } }),
    prisma.account.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!expense) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Editar gasto
      </h1>
      <ExpenseForm
        action={updateExpense.bind(null, id)}
        accounts={accounts.map((a) => ({ id: a.id, label: `${a.name} (${a.type})` }))}
        categories={categories.map((c) => ({ id: c.id, label: c.name }))}
        defaultValues={{
          description: expense.description,
          amount: centsToPesosInput(expense.amountCents),
          date: dateToInputValue(expense.date),
          accountId: expense.accountId,
          categoryId: expense.categoryId,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
