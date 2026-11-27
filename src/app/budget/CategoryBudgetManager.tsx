"use client";

import { useActionState, useId } from "react";
import type { ActionState } from "./actions";
import { addCategoryBudget, deleteCategoryBudget, updateCategoryBudget } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import { buttonPrimary, inputField, selectField } from "@/lib/styles";

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
  cancelLabel: string;
  savingLabel: string;
};

function CategoryBudgetRowForm({ row, copy }: { row: CategoryBudgetRow; copy: CategoryBudgetCopy }) {
  const amountId = useId();
  const [state, formAction, isPending] = useActionState(
    updateCategoryBudget.bind(null, row.categoryId),
    initialState
  );

  return (
    <div className="flex flex-col gap-1 border-b border-line px-4 py-3.5 last:border-b-0 transition-colors hover:bg-canvas/60">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <label id={`${amountId}-category`} htmlFor={amountId} className="min-w-[140px] flex-1 text-sm font-semibold text-ink">{row.categoryName}</label>
        <input
          id={amountId}
          name="amount"
          type="text"
          inputMode="decimal"
          defaultValue={state?.values?.amount ?? row.defaultValue}
          placeholder={copy.amountPlaceholder}
          className={`${inputField} w-32 tabular-nums`}
        />
        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending ? copy.savingLabel : copy.saveCategoryButton}
        </button>
        <DeleteButton
          describedBy={`${amountId}-category`}
          action={deleteCategoryBudget.bind(null, row.categoryId)}
          confirmMessage={row.confirmMessage}
          label={copy.deleteLabel}
          pendingLabel={copy.deletingLabel}
          cancelLabel={copy.cancelLabel}
        />
      </form>
      <div aria-live="polite">
        {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      </div>
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
      <label className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:flex-1">
        <span className="text-sm font-medium text-ink-muted">{copy.categoryLabel}</span>
        <select key={state?.values?.categoryId ?? ""} name="categoryId" required defaultValue={state?.values?.categoryId ?? ""} className={`${selectField} w-full min-w-0`}>
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
          defaultValue={state?.values?.amount}
          placeholder={copy.amountPlaceholder}
          className={`${inputField} w-32 tabular-nums`}
        />
      </label>
      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? copy.savingLabel : copy.addCategoryButton}
      </button>
      <div aria-live="polite" className="w-full">
        {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      </div>
    </form>
  );
}

export function CategoryBudgetManager({
  canEdit,
  categoryBudgets,
  availableCategories,
  copy,
}: {
  canEdit: boolean;
  categoryBudgets: CategoryBudgetRow[];
  availableCategories: Option[];
  copy: CategoryBudgetCopy;
}) {
  return (
    <div className="flex flex-col gap-4">
      {categoryBudgets.length === 0 ? (
        <p className="text-sm text-ink-muted">{copy.noCategoryBudgets}</p>
      ) : (
        <div className="flex flex-col">
          {categoryBudgets.map((row) => (
            canEdit ? <CategoryBudgetRowForm key={row.categoryId} row={row} copy={copy} /> : (
              <div key={row.categoryId} className="flex justify-between gap-2 border-b border-line px-4 py-3.5 last:border-b-0">
                <span className="text-sm font-semibold text-ink">{row.categoryName}</span>
                <span className="text-sm tabular-nums text-ink">{row.defaultValue}</span>
              </div>
            )
          ))}
        </div>
      )}

      {canEdit && (availableCategories.length > 0 ? (
        <AddCategoryBudgetForm categories={availableCategories} copy={copy} />
      ) : (
        <p className="text-sm text-ink-faint">{copy.noCategoriesAvailable}</p>
      ))}
    </div>
  );
}
