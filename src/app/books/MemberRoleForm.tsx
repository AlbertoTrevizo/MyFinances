"use client";

import { useActionState, useId } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary, selectField } from "@/lib/styles";
import { setMemberRole } from "./actions";

export function MemberRoleForm({ bookId, userId, role, roles, label, submitLabel, savingLabel }: {
  bookId: string;
  userId: string;
  role: "editor" | "viewer";
  roles: Dictionary["books"]["roles"];
  label: string;
  submitLabel: string;
  savingLabel: string;
}) {
  const id = useId();
  const [state, formAction, pending] = useActionState(setMemberRole.bind(null, bookId, userId), undefined);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        key={role}
        id={id}
        name="role"
        defaultValue={role}
        disabled={pending}
        className={selectField}
        aria-invalid={state?.error ? true : undefined}
        aria-describedby={state?.error ? `${id}-error` : undefined}
      >
        <option value="editor">{roles.editor}</option>
        <option value="viewer">{roles.viewer}</option>
      </select>
      <button type="submit" disabled={pending} className={buttonPrimary}>{pending ? savingLabel : submitLabel}</button>
      <div aria-live="polite" className="w-full">
        {state?.error && <p id={`${id}-error`} className="text-sm text-danger">{state.error}</p>}
      </div>
    </form>
  );
}
