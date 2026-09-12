"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary, inputField } from "@/lib/styles";

const initialState: ActionState = undefined;

export function AccountForm({
  action,
  defaultValues,
  submitLabel,
  form,
  saving,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { name: string; type: string; cutoffDay: string; paymentDay: string };
  submitLabel: string;
  form: Dictionary["accounts"]["form"];
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

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{form.typeLabel}</span>
        <input
          name="type"
          type="text"
          required
          defaultValue={defaultValues?.type}
          placeholder={form.typePlaceholder}
          className={inputField}
        />
      </label>

      <p className="text-xs text-ink-faint">{form.creditOnlyHint}</p>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-muted">{form.cutoffDayLabel}</span>
          <input
            name="cutoffDay"
            type="number"
            min={1}
            max={31}
            defaultValue={defaultValues?.cutoffDay}
            placeholder={form.cutoffDayPlaceholder}
            className={`${inputField} font-mono`}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-muted">{form.paymentDayLabel}</span>
          <input
            name="paymentDay"
            type="number"
            min={1}
            max={31}
            defaultValue={defaultValues?.paymentDay}
            placeholder={form.paymentDayPlaceholder}
            className={`${inputField} font-mono`}
          />
        </label>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? saving : submitLabel}
      </button>
    </form>
  );
}
