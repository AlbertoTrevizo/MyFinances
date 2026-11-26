"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormField } from "@/components/FormField";
import { confirmEmail } from "./actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { authButtonPrimary } from "@/lib/styles";

export function ConfirmForm({ token, requiresPassword, t, passwordLabels, passwordHint }: {
  token: string;
  requiresPassword: boolean;
  t: Dictionary["confirmEmail"];
  passwordLabels: Dictionary["resetPassword"];
  passwordHint: string;
}) {
  const [state, formAction, isPending] = useActionState(confirmEmail, undefined);

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {requiresPassword && <>
        <FormField variant="filled" label={passwordLabels.passwordLabel} name="password" type="password" autoComplete="new-password" hint={passwordHint} error={state?.fieldErrors?.password} />
        <FormField variant="filled" label={passwordLabels.confirmLabel} name="confirm" type="password" autoComplete="new-password" error={state?.fieldErrors?.confirm} />
      </>}
      <div aria-live="polite">
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      </div>
      <button type="submit" disabled={isPending} className={authButtonPrimary}>
        {isPending ? t.confirming : t.button}
      </button>
    </form>
  );
}
