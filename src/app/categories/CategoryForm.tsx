"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary, inputField } from "@/lib/styles";

const initialState: ActionState = undefined;

export function CategoryForm({
  action,
  defaultValues,
  submitLabel,
  form,
  saving,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { name: string };
  submitLabel: string;
  form: Dictionary["categories"]["form"];
  saving: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{form.nameLabel}</span>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          placeholder={form.namePlaceholder}
          className={inputField}
        />
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? saving : submitLabel}
      </button>
    </form>
  );
}
