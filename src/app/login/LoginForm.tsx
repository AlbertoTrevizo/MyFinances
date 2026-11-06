"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginWithPassword, type ActionState } from "./actions";
import { ResendForm } from "../confirm-email/ResendForm";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";

const initialState: ActionState = undefined;

export function LoginForm({ t, resend }: { t: Dictionary["auth"]; resend: Dictionary["resend"] }) {
  const [state, formAction, isPending] = useActionState(loginWithPassword, initialState);

  return (
    <>
      <form action={formAction} noValidate className="flex flex-col gap-4">
        <FormField label={t.emailLabel} name="email" type="email" autoComplete="email" />
        <FormField
          label={t.passwordLabel}
          name="password"
          type="password"
          autoComplete="current-password"
        />

        {state?.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending ? t.signingIn : t.signInButton}
        </button>

        <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-strong">
          {t.forgotPasswordLink}
        </Link>
      </form>

      {state?.pendingEmail && (
        <div className="mt-4">
          <ResendForm t={resend} email={state.pendingEmail} />
        </div>
      )}
    </>
  );
}
