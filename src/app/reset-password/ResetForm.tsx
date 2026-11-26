"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { resetPassword } from "./actions";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { authButtonPrimary } from "@/lib/styles";

export function ResetForm({ token, t, passwordHint }: {
  token: string;
  t: Dictionary["resetPassword"];
  passwordHint: string;
}) {
  const [state, formAction, isPending] = useActionState(resetPassword, undefined);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    resultRef.current?.focus();
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  if (state?.invalid) {
    return (
      <div className="flex flex-col gap-2">
        <h2 ref={resultRef} tabIndex={-1} className="font-semibold text-ink">{t.invalidTitle}</h2>
        <p className="text-sm text-ink-muted">{t.invalidBody}</p>
        <Link href="/forgot-password" className="text-center text-sm text-primary hover:text-primary-strong">
          {t.requestNew}
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormField variant="filled" label={t.passwordLabel} name="password" type="password" autoComplete="new-password" hint={passwordHint} error={state?.fieldErrors?.password} />
      <FormField variant="filled" label={t.confirmLabel} name="confirm" type="password" autoComplete="new-password" error={state?.fieldErrors?.confirm} />
      <button type="submit" disabled={isPending} className={authButtonPrimary}>
        {isPending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
