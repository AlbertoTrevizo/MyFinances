import { prisma } from "@/lib/prisma";
import { centsToPesosInput } from "@/lib/currency";
import { EXPENSE_TYPES } from "@/lib/expense-type";
import { BudgetForm } from "./BudgetForm";
import { saveBudgets } from "./actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";

export default async function BudgetPage() {
  const { t } = await getTranslations();
  const budgets = await prisma.budget.findMany();
  const amountByType = new Map(budgets.map((b) => [b.type, b.amountCents]));

  const fields = EXPENSE_TYPES.map((type) => ({
    type,
    label: t.budget.amountLabel(t.expenseTypes[type]),
    defaultValue: amountByType.has(type) ? centsToPesosInput(amountByType.get(type)!) : "",
  }));

  return (
    <PageContainer title={<PageTitle>{t.budget.title}</PageTitle>}>
      <p className="text-sm text-ink-muted">{t.budget.description}</p>
      <BudgetForm
        action={saveBudgets}
        fields={fields}
        amountPlaceholder={t.budget.amountPlaceholder}
        saveSubmit={t.budget.saveSubmit}
        saving={t.common.saving}
      />
    </PageContainer>
  );
}
