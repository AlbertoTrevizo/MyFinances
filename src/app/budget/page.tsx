import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { centsToPesosInput } from "@/lib/currency";
import { EXPENSE_TYPES } from "@/lib/expense-type";
import { BudgetForm } from "./BudgetForm";
import { CategoryBudgetManager } from "./CategoryBudgetManager";
import { saveBudgets } from "./actions";
import { getTranslations } from "@/i18n/get-locale";
import { PageContainer, PageTitle } from "@/components/PageContainer";
import { card } from "@/lib/styles";
import { requireBook } from "@/lib/session";
import { canWrite } from "@/lib/book-rules";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.budget.title };
}

export default async function BudgetPage() {
  const { book, access } = await requireBook();
  const canEdit = canWrite(access);
  const { t } = await getTranslations();
  const [budgets, categories, categoryBudgets] = await Promise.all([
    prisma.budget.findMany({ where: { bookId: book.id } }),
    prisma.category.findMany({ where: { bookId: book.id }, orderBy: { createdAt: "asc" } }),
    prisma.categoryBudget.findMany({ where: { category: { bookId: book.id } }, include: { category: true } }),
  ]);
  const amountByType = new Map(budgets.map((b) => [b.type, b.amountCents]));

  const fields = EXPENSE_TYPES.map((type) => ({
    type,
    label: t.budget.amountLabel(t.expenseTypes[type]),
    defaultValue: amountByType.has(type) ? centsToPesosInput(amountByType.get(type)!) : "",
  }));

  const budgetedCategoryIds = new Set(categoryBudgets.map((cb) => cb.categoryId));
  const availableCategories = categories
    .filter((category) => !budgetedCategoryIds.has(category.id))
    .map((category) => ({ id: category.id, label: category.name }));

  const categoryBudgetRows = categoryBudgets
    .map((cb) => ({
      categoryId: cb.categoryId,
      categoryName: cb.category.name,
      defaultValue: centsToPesosInput(cb.amountCents),
      confirmMessage: t.budget.confirmRemoveCategoryBudget(cb.category.name),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  const categoryBudgetCopy = {
    amountPlaceholder: t.budget.amountPlaceholder,
    categoryLabel: t.budget.categoryLabel,
    categoryPlaceholder: t.budget.categoryPlaceholder,
    categoryAmountLabel: t.budget.categoryAmountLabel,
    addCategoryButton: t.budget.addCategoryButton,
    saveCategoryButton: t.budget.saveCategoryButton,
    noCategoriesAvailable: t.budget.noCategoriesAvailable,
    noCategoryBudgets: t.budget.noCategoryBudgets,
    deleteLabel: t.common.delete,
    deletingLabel: t.common.deleting,
    cancelLabel: t.common.cancel,
    savingLabel: t.common.saving,
  };

  return (
    <PageContainer title={<PageTitle>{t.budget.title}</PageTitle>}>
      <div className={`${card} flex flex-col gap-4 p-5 sm:p-6`}>
        <div>
          <h2 className="text-sm font-semibold text-ink">{t.budget.byTypeTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.budget.description}</p>
        </div>
        <BudgetForm
          canEdit={canEdit}
          action={saveBudgets}
          fields={fields}
          amountPlaceholder={t.budget.amountPlaceholder}
          saveSubmit={t.budget.saveSubmit}
          saving={t.common.saving}
        />
      </div>

      <div className={`${card} flex flex-col gap-4 p-5 sm:p-6`}>
        <div>
          <h2 className="text-sm font-semibold text-ink">{t.budget.byCategoryTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.budget.categoryDescription}</p>
        </div>
        <CategoryBudgetManager
          canEdit={canEdit}
          categoryBudgets={categoryBudgetRows}
          availableCategories={availableCategories}
          copy={categoryBudgetCopy}
        />
      </div>
    </PageContainer>
  );
}
