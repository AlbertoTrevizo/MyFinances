"use client";

import { useActionState, useId, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary, inputField, selectField } from "@/lib/styles";
import { createInviteLink, inviteByEmail } from "./actions";

export function InviteForm({ bookId, kind, copy, roles, roleLabel }: {
  bookId: string;
  kind: "email" | "link";
  copy: Dictionary["books"]["invite"];
  roles: Dictionary["books"]["roles"];
  roleLabel: string;
}) {
  const id = useId();
  const [state, formAction, pending] = useActionState((kind === "email" ? inviteByEmail : createInviteLink).bind(null, bookId), undefined);
  const [copyStatus, setCopyStatus] = useState("");
  return (
    <form action={formAction} className="flex flex-col items-start gap-3">
      {kind === "email" && <>
        <label htmlFor={`${id}-email`} className="text-sm font-medium">{copy.email}</label>
        <input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} disabled={pending} className={`${inputField} w-full`} aria-describedby={state?.error ? `${id}-status` : undefined} aria-invalid={state?.error ? true : undefined} />
      </>}
      <label htmlFor={`${id}-role`} className="text-sm font-medium">{roleLabel}</label>
      <select id={`${id}-role`} name="role" defaultValue="viewer" disabled={pending} className={selectField}>
        <option value="viewer">{roles.viewer}</option>
        <option value="editor">{roles.editor}</option>
      </select>
      <button type="submit" disabled={pending} className={buttonPrimary} onClick={() => setCopyStatus("")}>
        {kind === "email" ? (pending ? copy.sending : copy.send) : (pending ? copy.generating : copy.generate)}
      </button>
      <div id={`${id}-status`} aria-live="polite">
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        {state?.ok && kind === "email" && <p className="text-sm text-ink-muted">{copy.sent}</p>}
      </div>
      {state?.url && <div className="flex w-full min-w-0 flex-col items-start gap-3">
        <p className="text-sm text-ink-muted">{copy.linkHint}</p>
        <label htmlFor={`${id}-url`} className="sr-only">{copy.url}</label>
        <input id={`${id}-url`} value={state.url} readOnly className={`${inputField} w-full`} onFocus={(event) => event.currentTarget.select()} />
        <button type="button" className={buttonPrimary} onClick={async () => {
          try {
            await navigator.clipboard.writeText(state.url!);
            setCopyStatus(copy.copied);
          } catch {
            setCopyStatus(copy.copyFailed);
          }
        }}>{copy.copy}</button>
        <p role="status" className="text-sm text-ink-muted">{copyStatus}</p>
      </div>}
    </form>
  );
}
