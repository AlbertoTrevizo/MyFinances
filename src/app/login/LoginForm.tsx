"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginWithPassword, type ActionState } from "./actions";
import { ResendForm } from "../confirm-email/ResendForm";
import { FormField } from "@/components/FormField";
import type { Dictionary } from "@/i18n/dictionaries";
import { authButtonPrimary } from "@/lib/styles";

const initialState: ActionState = undefined;

export function LoginForm({ t, resend }: { t: Dictionary["auth"]; resend: Dictionary["resend"] }) {
  const [state, formAction, isPending] = useActionState(loginWithPassword, initialState);

  return (
    <>
      <form action={formAction} noValidate className="flex flex-col gap-4">
        <FormField variant="filled" label={t.emailLabel} name="email" type="email" autoComplete="username" defaultValue={state?.values?.email} />
        <FormField
          variant="filled"
          label={t.passwordLabel}
          name="password"
          type="password"
          autoComplete="current-password"
        />

        <div aria-live="polite">
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        </div>

        <Link href="/forgot-password" className="self-center rounded-sm text-center text-sm text-primary hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {t.forgotPasswordLink}
        </Link>

        <button type="submit" disabled={isPending} className={authButtonPrimary}>
          {isPending ? t.signingIn : t.signInButton}
        </button>
      </form>

      {state?.pendingEmail && (
        <div className="mt-4">
          <ResendForm t={resend} email={state.pendingEmail} />
        </div>
      )}
    </>
  );
}
