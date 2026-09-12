"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";
import type { Dictionary } from "@/i18n/dictionaries";

const initialState: ActionState = undefined;

type Option = { id: string; label: string };

export function ExpenseForm({
  action,
  accounts,
  categories,
  defaultValues,
  submitLabel,
  t,
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
  };
  submitLabel: string;
  t: Dictionary;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t.expenses.form.descriptionLabel}
        </span>
        <input
          name="description"
          type="text"
          required
          defaultValue={defaultValues?.description}
          placeholder={t.expenses.form.descriptionPlaceholder}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t.expenses.form.amountLabel}
        </span>
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          required
          defaultValue={defaultValues?.amount}
          placeholder={t.expenses.form.amountPlaceholder}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t.expenses.form.dateLabel}
        </span>
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t.expenses.form.accountLabel}
        </span>
        <select
          name="accountId"
          required
          defaultValue={defaultValues?.accountId ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            {t.expenses.form.accountPlaceholder}
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t.expenses.form.categoryLabel}
        </span>
        <select
          name="categoryId"
          required
          defaultValue={defaultValues?.categoryId ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            {t.expenses.form.categoryPlaceholder}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-500">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? t.common.saving : submitLabel}
      </button>
    </form>
  );
}
