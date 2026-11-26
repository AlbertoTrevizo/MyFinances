"use client";

import { useActionState, useEffect, useRef } from "react";
import { completeProfile } from "./actions";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { authButtonPrimary } from "@/lib/styles";

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
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  const values = state?.values ?? defaults;

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
      <FormField variant="filled" label={register.nameLabel} name="name" autoComplete="given-name" defaultValue={values.name} error={state?.fieldErrors?.name} />
      <FormField variant="filled" label={register.lastNameLabel} name="lastName" autoComplete="family-name" defaultValue={values.lastName} error={state?.fieldErrors?.lastName} />
      <button type="submit" disabled={isPending} className={authButtonPrimary}>
        {t.submit}
      </button>
    </form>
  );
}
