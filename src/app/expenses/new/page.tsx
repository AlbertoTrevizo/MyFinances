import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "../ExpenseForm";
import { createExpense } from "../actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";

export default async function NewExpensePage() {
  const { t } = await getTranslations();
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (accounts.length === 0) {
    return (
      <PageContainer title={<PageTitle>{t.expenses.newTitle}</PageTitle>}>
        <p className="text-sm text-ink-muted">{t.expenses.needsAccount}</p>
        <Link
          href="/accounts/new"
          className="w-fit text-sm font-medium text-primary underline underline-offset-2"
        >
          {t.expenses.createAccountLink}
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={<PageTitle>{t.expenses.newTitle}</PageTitle>}>
      <ExpenseForm
        action={createExpense}
        accounts={accounts.map((a) => ({ id: a.id, label: `${a.name} (${a.type})`, cutoffDay: a.cutoffDay }))}
        categories={categories.map((c) => ({ id: c.id, label: c.name }))}
        submitLabel={t.expenses.createSubmit}
        form={t.expenses.form}
        noCategory={t.expenses.noCategory}
        expenseTypes={t.expenseTypes}
        allowMsi
        saving={t.common.saving}
      />
    </PageContainer>
  );
}
