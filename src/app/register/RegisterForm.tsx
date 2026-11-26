"use client";

import { useActionState, useEffect, useRef } from "react";
import { register } from "./actions";
import { ResendForm } from "../confirm-email/ResendForm";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { authButtonPrimary } from "@/lib/styles";

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
  const resultRef = useRef<HTMLHeadingElement>(null);
  const failureRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    resultRef.current?.focus();
    failureRef.current?.focus();
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  if (state?.sent) {
    return (
      <div>
        <h2 ref={resultRef} tabIndex={-1} className="mb-1 font-semibold text-ink">{t.checkEmailTitle}</h2>
        <p className="text-sm text-ink-muted">{t.checkEmailBody}</p>
      </div>
    );
  }

  if (state?.sendFailedEmail) {
    return (
      <div className="flex flex-col gap-4">
        <p ref={failureRef} tabIndex={-1} className="text-sm text-danger">
          {t.emailNotSent}
        </p>
        <ResendForm t={resend} email={state.sendFailedEmail} />
      </div>
    );
  }

  const errors = state?.fieldErrors;
  const values = state?.values;
  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
      <FormField variant="filled" label={t.nameLabel} name="name" autoComplete="given-name" defaultValue={values?.name} error={errors?.name} />
      <FormField variant="filled" label={t.lastNameLabel} name="lastName" autoComplete="family-name" defaultValue={values?.lastName} error={errors?.lastName} />
      <FormField variant="filled" label={auth.emailLabel} name="email" type="email" autoComplete="email" defaultValue={values?.email} error={errors?.email} />
      <FormField variant="filled" label={auth.passwordLabel} name="password" type="password" autoComplete="new-password" hint={t.passwordHint} error={errors?.password} />
      <FormField variant="filled" label={t.confirmPasswordLabel} name="confirm" type="password" autoComplete="new-password" error={errors?.confirm} />
      <button type="submit" disabled={isPending} className={authButtonPrimary}>
        {isPending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
