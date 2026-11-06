"use client";

import { useActionState } from "react";
import { completeProfile } from "./actions";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";

export function ProfileForm({
  t,
  register,
  defaults,
}: {
  t: Dictionary["completeProfile"];
  register: Dictionary["register"];
  defaults: { name: string; lastName: string };
}) {
  const [state, formAction, isPending] = useActionState(completeProfile, undefined);
  const values = state?.values ?? defaults;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <FormField label={register.nameLabel} name="name" autoComplete="given-name" defaultValue={values.name} error={state?.fieldErrors?.name} />
      <FormField label={register.lastNameLabel} name="lastName" autoComplete="family-name" defaultValue={values.lastName} error={state?.fieldErrors?.lastName} />
      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {t.submit}
      </button>
    </form>
  );
}
