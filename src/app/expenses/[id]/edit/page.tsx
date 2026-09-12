import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centsToPesosInput } from "@/lib/currency";
import { dateToInputValue } from "@/lib/date";
import { ExpenseForm } from "../../ExpenseForm";
import { updateExpense } from "../../actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getTranslations();
  const [expense, accounts, categories] = await Promise.all([
    prisma.expense.findUnique({ where: { id } }),
    prisma.account.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!expense) notFound();

  return (
    <PageContainer title={<PageTitle>{t.expenses.editTitle}</PageTitle>}>
      <ExpenseForm
        action={updateExpense.bind(null, id)}
        accounts={accounts.map((a) => ({ id: a.id, label: `${a.name} (${a.type})` }))}
        categories={categories.map((c) => ({ id: c.id, label: c.name }))}
        defaultValues={{
          description: expense.description,
          amount: centsToPesosInput(expense.amountCents),
          date: dateToInputValue(expense.date),
          accountId: expense.accountId,
          categoryId: expense.categoryId ?? "",
          type: expense.type ?? "",
        }}
        submitLabel={t.expenses.editSubmit}
        form={t.expenses.form}
        noCategory={t.expenses.noCategory}
        expenseTypes={t.expenseTypes}
        saving={t.common.saving}
      />
    </PageContainer>
  );
}
