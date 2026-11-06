"use client";

import { useActionState } from "react";
import { register } from "./actions";
import { ResendForm } from "../confirm-email/ResendForm";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";

export function RegisterForm({
  t,
  auth,
  resend,
}: {
  t: Dictionary["register"];
  auth: Dictionary["auth"];
  resend: Dictionary["resend"];
}) {
  const [state, formAction, isPending] = useActionState(register, undefined);

  if (state?.sent) {
    return (
      <div role="status">
        <h2 className="mb-1 font-semibold text-ink">{t.checkEmailTitle}</h2>
        <p className="text-sm text-ink-muted">{t.checkEmailBody}</p>
      </div>
    );
  }

  if (state?.sendFailedEmail) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-sm text-danger">
          {t.emailNotSent}
        </p>
        <ResendForm t={resend} email={state.sendFailedEmail} />
      </div>
    );
  }

  const errors = state?.fieldErrors;
  const values = state?.values;
  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <FormField label={t.nameLabel} name="name" autoComplete="given-name" defaultValue={values?.name} error={errors?.name} />
      <FormField label={t.lastNameLabel} name="lastName" autoComplete="family-name" defaultValue={values?.lastName} error={errors?.lastName} />
      <FormField label={auth.emailLabel} name="email" type="email" autoComplete="email" defaultValue={values?.email} error={errors?.email} />
      <FormField label={auth.passwordLabel} name="password" type="password" autoComplete="new-password" hint={t.passwordHint} error={errors?.password} />
      <FormField label={t.confirmPasswordLabel} name="confirm" type="password" autoComplete="new-password" error={errors?.confirm} />
      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
