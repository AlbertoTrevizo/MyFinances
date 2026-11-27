"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "@/lib/styles";
import { setActiveBook } from "../books/actions";
import { acceptInvitation } from "./actions";

export function InvitationForm({ token, bookId, alreadyMember, copy, conflict, switching }: {
  token: string;
  bookId: string;
  alreadyMember: boolean;
  copy: Dictionary["books"]["invitation"];
  conflict: string;
  switching: string;
}) {
  const router = useRouter();
  const [state, join, pending] = useActionState(async () => acceptInvitation(token), undefined);
  const isMember = alreadyMember || state?.error === "alreadyMember";
  const [, go, going] = useActionState(async () => {
    await setActiveBook(bookId);
    router.push("/");
    router.refresh();
    return undefined;
  }, undefined);
  return (
    <form action={isMember ? go : join} className="flex flex-col items-start gap-4">
      <div aria-live="polite">
        {isMember ? <p>{copy.alreadyMember}</p> : state?.error && <p className="text-danger">{state.error === "conflict" ? conflict : copy[state.error]}</p>}
      </div>
      {(!state?.error || isMember || state.error === "conflict") && (
        <button type="submit" className={buttonPrimary} disabled={pending || going}>
          {isMember ? (going ? switching : copy.goToBook) : (pending ? copy.joining : copy.join)}
        </button>
      )}
    </form>
  );
}
