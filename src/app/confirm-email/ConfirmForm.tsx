"use client";

import { useActionState } from "react";
import { confirmEmail } from "./actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";

export function ConfirmForm({ token, t }: { token: string; t: Dictionary["confirmEmail"] }) {
  const [state, formAction, isPending] = useActionState(confirmEmail, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={isPending} className={buttonPrimary}>
        {isPending ? t.confirming : t.button}
      </button>
    </form>
  );
}
