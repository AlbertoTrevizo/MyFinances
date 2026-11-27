"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";
import { buttonPrimary, inputField } from "@/lib/styles";

const initialState: ActionState = undefined;

export function BudgetForm({
  canEdit,
  action,
  fields,
  amountPlaceholder,
  saveSubmit,
  saving,
}: {
  canEdit: boolean;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: { type: string; label: string; defaultValue: string }[];
  amountPlaceholder: string;
  saveSubmit: string;
  saving: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={canEdit ? formAction : undefined} className="flex max-w-md flex-col gap-4">
      {fields.map((field) => (
        <label key={field.type} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-muted">{field.label}</span>
          <input
            readOnly={!canEdit}
            name={field.type}
            type="text"
            inputMode="decimal"
            defaultValue={state?.values?.[field.type] ?? field.defaultValue}
            placeholder={amountPlaceholder}
            className={`${inputField} tabular-nums`}
          />
        </label>
      ))}

      <div aria-live="polite">
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      </div>

      {canEdit && <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? saving : saveSubmit}
      </button>}
    </form>
  );
}
