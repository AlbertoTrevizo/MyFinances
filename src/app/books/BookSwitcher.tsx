"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonPrimary, selectField } from "@/lib/styles";
import { setActiveBook } from "./actions";

export function BookSwitcher({ activeBook, books, label }: {
  activeBook: { id: string; name: string };
  books: { id: string; name: string }[];
  label: string;
}) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">{label}</label>
      <select
        id={id}
        value={activeBook.id}
        title={activeBook.name}
        disabled={pending}
        className={`${selectField} w-full min-w-0`}
        onChange={(event) => {
          const bookId = event.currentTarget.value;
          startTransition(async () => {
            await setActiveBook(bookId);
            router.refresh();
          });
        }}
      >
        {books.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}
      </select>
    </div>
  );
}

export function SwitchBookButton({ bookId, label, pendingLabel }: { bookId: string; label: string; pendingLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" disabled={pending} className={buttonPrimary} onClick={() => {
      startTransition(async () => {
        await setActiveBook(bookId);
        router.refresh();
      });
    }}>
      {pending ? pendingLabel : label}
    </button>
  );
}
