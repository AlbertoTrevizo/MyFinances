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
  const values = state?.values ?? defaultValues;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{form.nameLabel}</span>
        <input
          name="name"
          type="text"
          required
          defaultValue={values?.name}
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
          defaultValue={values?.type}
          placeholder={form.typePlaceholder}
          className={inputField}
        />
      </label>

      <p className="text-xs text-ink-faint">{form.creditOnlyHint}</p>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-muted">{form.cutoffDayLabel}</span>
          <input
            key={values?.cutoffDay}
            name="cutoffDay"
            type="number"
            min={1}
            max={31}
            defaultValue={values?.cutoffDay}
            placeholder={form.cutoffDayPlaceholder}
            className={`${inputField} tabular-nums`}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-muted">{form.paymentDayLabel}</span>
          <input
            key={values?.paymentDay}
            name="paymentDay"
            type="number"
            min={1}
            max={31}
            defaultValue={values?.paymentDay}
            placeholder={form.paymentDayPlaceholder}
            className={`${inputField} tabular-nums`}
          />
        </label>
      </div>

      <div aria-live="polite">
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      </div>

      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? saving : submitLabel}
      </button>
    </form>
  );
}
