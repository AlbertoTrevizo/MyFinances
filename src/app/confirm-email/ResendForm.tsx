"use client";

import { useActionState } from "react";
import { requestConfirmation } from "./actions";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";

// With `email` it posts that address; without it, it asks for one.
export function ResendForm({ t, email }: { t: Dictionary["resend"]; email?: string }) {
  const [state, formAction, isPending] = useActionState(requestConfirmation, undefined);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
        <FormField label={t.emailLabel} name="email" type="email" autoComplete="email" />
      )}
      <div aria-live="polite">
        {state?.sent && <p className="text-sm text-ink-muted">{t.sent}</p>}
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      </div>
      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? t.sending : t.button}
      </button>
    </form>
  );
}
