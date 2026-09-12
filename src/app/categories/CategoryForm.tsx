"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";
import type { Dictionary } from "@/i18n/dictionaries";

const initialState: ActionState = undefined;

export function CategoryForm({
  action,
  defaultValues,
  submitLabel,
  t,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { name: string };
  submitLabel: string;
  t: Dictionary;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t.categories.form.nameLabel}
        </span>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          placeholder={t.categories.form.namePlaceholder}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
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
