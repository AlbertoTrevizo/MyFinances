"use client";

import { useActionState } from "react";
import { FormField } from "@/components/FormField";
import { buttonPrimary } from "@/lib/styles";
import type { ActionState } from "./actions";

export function BookForm({ action, name, nameLabel, submitLabel, savingLabel }: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  name?: string;
  nameLabel: string;
  submitLabel: string;
  savingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} noValidate className="flex max-w-md flex-col gap-4">
      <FormField name="name" label={nameLabel} defaultValue={state?.values?.name ?? name} error={state?.error} />
      <button type="submit" disabled={pending} className={buttonPrimary}>
        {pending ? savingLabel : submitLabel}
      </button>
    </form>
  );
}
