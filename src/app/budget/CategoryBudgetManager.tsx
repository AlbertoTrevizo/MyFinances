"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";
import { addCategoryBudget, deleteCategoryBudget, updateCategoryBudget } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { buttonPrimary, inputField } from "@/lib/styles";

const initialState: ActionState = undefined;

type Option = { id: string; label: string };
type CategoryBudgetRow = {
  categoryId: string;
  categoryName: string;
  defaultValue: string;
  confirmMessage: string;
};

export type CategoryBudgetCopy = {
  amountPlaceholder: string;
  categoryLabel: string;
  categoryPlaceholder: string;
  categoryAmountLabel: string;
  addCategoryButton: string;
  saveCategoryButton: string;
  noCategoriesAvailable: string;
  noCategoryBudgets: string;
  deleteLabel: string;
  deletingLabel: string;
  savingLabel: string;
};

function CategoryBudgetRowForm({ row, copy }: { row: CategoryBudgetRow; copy: CategoryBudgetCopy }) {
  const [state, formAction, isPending] = useActionState(
    updateCategoryBudget.bind(null, row.categoryId),
    initialState
  );

  return (
    <div className="flex flex-col gap-1">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <span className="min-w-[140px] flex-1 text-sm text-ink">{row.categoryName}</span>
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          defaultValue={row.defaultValue}
          placeholder={copy.amountPlaceholder}
          className={`${inputField} w-32 font-mono`}
        />
        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending ? copy.savingLabel : copy.saveCategoryButton}
        </button>
        <DeleteButton
          action={deleteCategoryBudget.bind(null, row.categoryId)}
          confirmMessage={row.confirmMessage}
          label={copy.deleteLabel}
          pendingLabel={copy.deletingLabel}
        />
      </form>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
    </div>
  );
}

function AddCategoryBudgetForm({
  categories,
  copy,
}: {
  categories: Option[];
  copy: CategoryBudgetCopy;
}) {
  const [state, formAction, isPending] = useActionState(addCategoryBudget, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{copy.categoryLabel}</span>
        <select name="categoryId" required defaultValue="" className={inputField}>
          <option value="" disabled>
            {copy.categoryPlaceholder}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{copy.categoryAmountLabel}</span>
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          placeholder={copy.amountPlaceholder}
          className={`${inputField} w-32 font-mono`}
        />
      </label>
      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? copy.savingLabel : copy.addCategoryButton}
      </button>
      {state?.error && <p className="w-full text-xs text-danger">{state.error}</p>}
    </form>
  );
}

export function CategoryBudgetManager({
  categoryBudgets,
  availableCategories,
  copy,
}: {
  categoryBudgets: CategoryBudgetRow[];
  availableCategories: Option[];
  copy: CategoryBudgetCopy;
}) {
  return (
    <div className="flex flex-col gap-4">
      {categoryBudgets.length === 0 ? (
        <p className="text-sm text-ink-muted">{copy.noCategoryBudgets}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {categoryBudgets.map((row) => (
            <CategoryBudgetRowForm key={row.categoryId} row={row} copy={copy} />
          ))}
        </div>
      )}

      {availableCategories.length > 0 ? (
        <AddCategoryBudgetForm categories={availableCategories} copy={copy} />
      ) : (
        <p className="text-sm text-ink-faint">{copy.noCategoriesAvailable}</p>
      )}
    </div>
  );
}
