"use client";

import { useActionState } from "react";
import { loginWithPassword, type ActionState } from "./actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary, inputField } from "@/lib/styles";

const initialState: ActionState = undefined;

export function LoginForm({ t }: { t: Dictionary["auth"] }) {
  const [state, formAction, isPending] = useActionState(loginWithPassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{t.emailLabel}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputField}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-muted">{t.passwordLabel}</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputField}
        />
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? t.signingIn : t.signInButton}
      </button>
    </form>
  );
}
