"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "./actions";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";

export function ForgotForm({ t, emailLabel }: { t: Dictionary["forgotPassword"]; emailLabel: string }) {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <FormField label={emailLabel} name="email" type="email" autoComplete="email" />
      <div aria-live="polite">
        {state?.sent && <p className="text-sm text-ink-muted">{t.sent}</p>}
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      </div>
      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
