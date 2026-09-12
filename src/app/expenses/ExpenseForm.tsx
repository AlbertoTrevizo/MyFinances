"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { EXPENSE_TYPES } from "@/lib/expense-type";
import { buttonPrimary, inputField } from "@/lib/styles";

const initialState: ActionState = undefined;

type Option = { id: string; label: string };

export function ExpenseForm({
  action,
  accounts,
  categories,
  defaultValues,
  submitLabel,
  form,
  noCategory,
  expenseTypes,
  saving,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  accounts: Option[];
  categories: Option[];
  defaultValues?: {
    description: string;
    amount: string;
    date: string;
    accountId: string;
    categoryId: string;
    type: string;
  };
  submitLabel: string;
  form: Dictionary["expenses"]["form"];
  noCategory: string;
  expenseTypes: Dictionary["expenseTypes"];
  saving: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">
          {form.descriptionLabel}
        </span>
        <input
          name="description"
          type="text"
          required
          defaultValue={defaultValues?.description}
          placeholder={form.descriptionPlaceholder}
          className={inputField}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{form.amountLabel}</span>
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          required
          defaultValue={defaultValues?.amount}
          placeholder={form.amountPlaceholder}
          className={`${inputField} font-mono`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{form.dateLabel}</span>
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date}
          className={inputField}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{form.accountLabel}</span>
        <select
          name="accountId"
          required
          defaultValue={defaultValues?.accountId ?? ""}
          className={inputField}
        >
          <option value="" disabled>
            {form.accountPlaceholder}
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{form.categoryLabel}</span>
        <select
          name="categoryId"
          defaultValue={defaultValues?.categoryId ?? ""}
          className={inputField}
        >
          <option value="">{noCategory}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{form.typeLabel}</span>
        <select
          name="type"
          required
          defaultValue={defaultValues?.type ?? ""}
          className={inputField}
        >
          <option value="" disabled>
            {form.typePlaceholder}
          </option>
          {EXPENSE_TYPES.map((type) => (
            <option key={type} value={type}>
              {expenseTypes[type]}
            </option>
          ))}
        </select>
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? saving : submitLabel}
      </button>
    </form>
  );
}
