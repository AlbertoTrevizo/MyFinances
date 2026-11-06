"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "./actions";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";

export function ResetForm({ token, t }: { token: string; t: Dictionary["resetPassword"] }) {
  const [state, formAction, isPending] = useActionState(resetPassword, undefined);

  if (state?.invalid) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-ink">{t.invalidTitle}</h2>
        <p className="text-sm text-ink-muted">{t.invalidBody}</p>
        <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-strong">
          {t.requestNew}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormField label={t.passwordLabel} name="password" type="password" autoComplete="new-password" error={state?.fieldErrors?.password} />
      <FormField label={t.confirmLabel} name="confirm" type="password" autoComplete="new-password" error={state?.fieldErrors?.confirm} />
      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
